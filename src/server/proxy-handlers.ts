/**
 * Server-side proxy and caching layer for Google Sheets & Payments Webhooks.
 * Runs across Cloudflare Workers / Nitro SSR, Cloudflare Pages Functions, and Vite dev server middleware.
 */

import { supabaseAdmin } from "../lib/supabase";

const SHEETS_WEBHOOK_URL = process.env["SHEETS_WEBHOOK_URL"];
const PAYMENTS_WEBHOOK_URL = process.env["PAYMENTS_WEBHOOK_URL"];
const ADMIN_SECRET_TOKEN = process.env["ADMIN_SECRET_TOKEN"];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  const allowed =
    origin === "http://localhost:3000" ||
    origin.endsWith("-makeathon-zero-hour.vercel.app") ||
    origin === "https://makeathon-zero-hour.vercel.app"
      ? origin
      : "https://makeathon-zero-hour.vercel.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Requested-With",
  };
}

function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  request?: Request,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(request as Request), "Content-Type": "application/json", ...headers },
  });
}

// Convert Supabase snake_case to frontend camelCase
function mapSupabaseToRegistration(row: any, paymentData: any = null) {
  const isExplicitFalse =
    row.paid === false ||
    String(row.paid || "").toLowerCase() === "false" ||
    String(row.paid || "").toUpperCase() === "NO";
    
  let isPaid = false;
  if (!isExplicitFalse) {
     isPaid = Boolean(row.paid) ||
       String(row.paid || "").toLowerCase() === "true" ||
       String(row.paid || "").toUpperCase() === "YES" ||
       Boolean(row.payment_ref) ||
       Boolean(paymentData);
  }

  return {
    id: row.id,
    teamName: row.team_name,
    leaderName: row.leader_name,
    email: row.email,
    phone: row.phone || "",
    institution: row.institution || "",
    track: row.track || "",
    teamSize: String(row.team_size || "4"),
    brief: row.brief || "",
    timestamp: row.timestamp || new Date().toISOString(),
    checkedIn: Boolean(row.checked_in),
    paid: isPaid,
    paymentRef: row.payment_ref || paymentData?.payment_ref || undefined,
    memberNames: row.member_names || [],
    source: "remote",
    syncedToRemote: true,
  };
}

export async function handleRegistrationsProxy(
  request: Request,
  _env?: unknown,
  _ctx?: unknown,
): Promise<Response> {
  if (!SHEETS_WEBHOOK_URL || !ADMIN_SECRET_TOKEN) {
    return jsonResponse({ error: "Server misconfiguration" }, 500, {}, request);
  }

  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization");
  const isAuthenticated = authHeader === `Bearer ${ADMIN_SECRET_TOKEN}`;

  const url = new URL(request.url);

  // ── GET: Read registrations ──
  if (request.method === "GET") {
    if (!isAuthenticated) return jsonResponse({ error: "Unauthorized" }, 401, {}, request);

    try {
      // 1. Read from Supabase FIRST
      const { data: supabaseRegs, error: supabaseError } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .order("timestamp", { ascending: false });

      const { data: supabasePayments, error: paymentsError } = await supabaseAdmin
        .from("payments")
        .select("*");

      if (!supabaseError && supabaseRegs && supabaseRegs.length > 0) {
        // Merge payments
        const paymentMap = new Map();
        if (!paymentsError && supabasePayments) {
          for (const p of supabasePayments) {
            paymentMap.set(p.id, p);
          }
        }
        
        const mapped = supabaseRegs.map(row => mapSupabaseToRegistration(row, paymentMap.get(row.id)));
        
        return jsonResponse(mapped, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }, request);
      } else {
        console.warn("Supabase GET returned empty or failed, falling back to Sheets", supabaseError);
      }
    } catch (err) {
      console.warn("Supabase GET threw an error, falling back to Sheets", err);
    }

    // 2. Fallback to Sheets
    const targetUrl = url.searchParams.get("url")?.trim() || SHEETS_WEBHOOK_URL;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const upstreamRes = await fetch(
        `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          redirect: "follow",
        }
      );
      clearTimeout(timeout);

      if (!upstreamRes.ok) {
        throw new Error(`Upstream returned HTTP ${upstreamRes.status}`);
      }
      const rawText = await upstreamRes.text();
      return new Response(rawText, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (err) {
      return jsonResponse({ error: "Upstream fetch failed" }, 502, {}, request);
    }
  }

  // ── POST: Mutations (Dual-write) ──
  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const action = body["action"] as string | undefined;

      if (action && action !== "register" && !isAuthenticated) {
        return jsonResponse({ error: "Unauthorized" }, 401, {}, request);
      }

      const { url: _strippedUrl, ...actionPayload } = body;
      const targetUrl = (typeof body["url"] === "string" && body["url"].trim()) || SHEETS_WEBHOOK_URL;

      // New Registration
      if (!action || action === "register") {
        const { id, teamName, leaderName, email, phone, institution, track, teamSize, brief, timestamp } = actionPayload as any;
        
        // 1. Supabase insert
        const { error: sbError } = await supabaseAdmin.from("registrations").upsert({
          id,
          team_name: teamName,
          leader_name: leaderName,
          email,
          phone,
          institution,
          track,
          team_size: parseInt(teamSize, 10) || 4,
          brief,
          timestamp: timestamp || new Date().toISOString(),
          source: "form"
        });
        
        if (sbError) console.error("Supabase insert error (registration):", sbError);

        // 2. Sheets POST
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const upstreamRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(actionPayload),
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);
        
        return jsonResponse({ success: true, from: sbError ? "sheets-only" : "dual" }, 200, {}, request);
      }

      // Check-in
      if (action === "updateCheckIn") {
        const { id, checkedIn } = actionPayload as any;
        
        const { error: sbError } = await supabaseAdmin
          .from("registrations")
          .update({ checked_in: Boolean(checkedIn) })
          .eq("id", id);
          
        if (sbError) console.error("Supabase update error (checkIn):", sbError);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const upstreamRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(actionPayload),
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);
        
        return jsonResponse({ success: true, from: sbError ? "sheets-only" : "dual" }, 200, {}, request);
      }

      // Member Names
      if (action === "updateMemberNames") {
        const { id, memberNames } = actionPayload as any;
        let parsedNames = [];
        try {
          parsedNames = typeof memberNames === "string" ? JSON.parse(memberNames) : memberNames;
        } catch(e) {}
        
        const { error: sbError } = await supabaseAdmin
          .from("registrations")
          .update({ member_names: parsedNames })
          .eq("id", id);
          
        if (sbError) console.error("Supabase update error (memberNames):", sbError);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const upstreamRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(actionPayload),
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);
        
        return jsonResponse({ success: true, from: sbError ? "sheets-only" : "dual" }, 200, {}, request);
      }

      // Delete
      if (action === "delete") {
        const { id } = actionPayload as any;
        
        const { error: sbError } = await supabaseAdmin
          .from("registrations")
          .delete()
          .eq("id", id);
          
        if (sbError) console.error("Supabase delete error:", sbError);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const upstreamRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(actionPayload),
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);
        
        return jsonResponse({ success: true, from: sbError ? "sheets-only" : "dual" }, 200, {}, request);
      }

    } catch (err) {
      console.error("Registrations proxy POST error:", err);
      return jsonResponse({ success: false, error: "Failed to forward action" }, 500, {}, request);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405, {}, request);
}

export async function handlePaymentsProxy(
  request: Request,
  _env?: unknown,
  _ctx?: unknown,
): Promise<Response> {
  if (!PAYMENTS_WEBHOOK_URL || !ADMIN_SECRET_TOKEN) {
    return jsonResponse({ error: "Server misconfiguration" }, 500, {}, request);
  }

  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET_TOKEN}`) {
    return jsonResponse({ error: "Unauthorized" }, 401, {}, request);
  }

  const url = new URL(request.url);

  if (request.method === "GET") {
    // With Supabase, we don't strictly need to fetch payments here for the admin panel, 
    // as it's merged in registrations proxy. But we'll keep the fallback.
    const targetUrl = url.searchParams.get("url")?.trim() || PAYMENTS_WEBHOOK_URL;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const upstreamRes = await fetch(
        `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          redirect: "follow",
        }
      );
      clearTimeout(timeout);

      const rawText = await upstreamRes.text();
      return new Response(rawText, {
        status: upstreamRes.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (err) {
      return jsonResponse({ error: "Upstream fetch failed" }, 502, {}, request);
    }
  }

  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const targetUrl = (typeof body["url"] === "string" && body["url"].trim()) || PAYMENTS_WEBHOOK_URL;
      const { url: _strippedUrl, ...actionPayload } = body;
      
      const { action, id, paymentRef, email } = actionPayload as any;

      if (action === "markPaid") {
        if (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim() === "") {
          return jsonResponse({ error: "paymentRef is required" }, 400, {}, request);
        }
        
        // 1. Supabase update registrations
        const { error: sbError1 } = await supabaseAdmin
          .from("registrations")
          .update({ paid: true, payment_ref: paymentRef.trim() })
          .eq("id", id);
          
        if (sbError1) console.error("Supabase update paid error:", sbError1);

        // 2. Supabase upsert payments
        const { error: sbError2 } = await supabaseAdmin
          .from("payments")
          .upsert({ id, payment_ref: paymentRef.trim(), email: email || "" });
          
        if (sbError2) console.error("Supabase upsert payment error:", sbError2);
      } else if (action === "markUnpaid") {
        // 1. Supabase update registrations
        const { error: sbError1 } = await supabaseAdmin
          .from("registrations")
          .update({ paid: false, payment_ref: null })
          .eq("id", id);
          
        // 2. Supabase delete from payments
        await supabaseAdmin.from("payments").delete().eq("id", id);
      }

      // 3. Post to comms automation script (PAYMENTS_WEBHOOK_URL)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const upstreamRes = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionPayload),
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);
      
      // 4. Post to Sheets script (SHEETS_WEBHOOK_URL) for backup 
      // (The prompt requested: POST to SHEETS_WEBHOOK_URL with { action: 'updatePayment', id, paid, paymentRef } )
      if (process.env.SHEETS_WEBHOOK_URL) {
         fetch(process.env.SHEETS_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updatePayment",
              id,
              paid: action === "markPaid",
              paymentRef: action === "markPaid" ? paymentRef.trim() : ""
            })
         }).catch(err => console.error("Fallback Sheets updatePayment failed:", err));
      }

      return jsonResponse({ success: true }, 200, {}, request);
    } catch (err) {
      console.error("Payments proxy POST error:", err);
      return jsonResponse({ success: false, error: "Failed to forward payment" }, 500, {}, request);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405, {}, request);
}
