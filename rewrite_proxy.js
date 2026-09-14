import fs from 'fs';

const code = `/**
 * Server-side proxy and caching layer for Google Sheets & Payments Webhooks.
 * Runs across Cloudflare Workers / Nitro SSR, Cloudflare Pages Functions, and Vite dev server middleware.
 */

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
  const isAuthenticated = authHeader === \`Bearer \${ADMIN_SECRET_TOKEN}\`;

  const url = new URL(request.url);

  if (request.method === "GET") {
    if (!isAuthenticated) return jsonResponse({ error: "Unauthorized" }, 401, {}, request);

    const targetUrl = url.searchParams.get("url")?.trim() || SHEETS_WEBHOOK_URL;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      
      const upstreamRes = await fetch(
        \`\${targetUrl}\${targetUrl.includes("?") ? "&" : "?"}_t=\${Date.now()}\`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          redirect: "follow",
        }
      );
      
      let paymentsData: any[] = [];
      if (PAYMENTS_WEBHOOK_URL) {
         try {
            const pRes = await fetch(
              \`\${PAYMENTS_WEBHOOK_URL}\${PAYMENTS_WEBHOOK_URL.includes("?") ? "&" : "?"}_t=\${Date.now()}\`,
              { method: "GET", headers: { Accept: "application/json" } }
            );
            if (pRes.ok) {
               const pJson: any = await pRes.json();
               paymentsData = Array.isArray(pJson) ? pJson : (Array.isArray(pJson.data) ? pJson.data : []);
            }
         } catch(e) {}
      }
      clearTimeout(timeout);

      if (!upstreamRes.ok) {
        throw new Error(\`Upstream returned HTTP \${upstreamRes.status}\`);
      }
      
      const rawText = await upstreamRes.text();
      let json: any = JSON.parse(rawText);
      
      if (Array.isArray(json)) {
        // Map Payments
        const paymentMap = new Map();
        for (const item of paymentsData) {
          const id = String(item.id || item.ID || item["Pass ID"] || item["PassID"] || item.passId || "").trim();
          if (!id) continue;
          const isExplicitFalse =
            item.paid === false ||
            String(item.paid || "").toLowerCase() === "false" ||
            String(item.status || "").toLowerCase() === "unpaid" ||
            String(item.status || "").toLowerCase() === "not paid" ||
            String(item.paid || "").toUpperCase() === "NO" ||
            String(item["Paid"] || "").toUpperCase() === "NO";

          const paymentRef = String(
            item.paymentRef || item.referenceId || item["Payment Ref"] || item["Payment Reference ID"] || "",
          ).trim();

          const paid = !isExplicitFalse && (item.paid === true || String(item.paid || "").toLowerCase() === "true" || String(item["Paid"] || "").toUpperCase() === "YES" || Boolean(paymentRef));
          
          paymentMap.set(id, { paid, paymentRef });
        }
        
        // Map Registrations
        const mapped = json.map(item => {
           const id = String(item.id || item.ID || item["Pass ID"] || \`ZH-\${Math.floor(100000 + Math.random() * 900000)}\`);
           const payInfo = paymentMap.get(id) || {};
           
           return {
             id,
             teamName: String(item.teamName || item["Team Name"] || "Unnamed Squad"),
             leaderName: String(item.leaderName || item["Leader Name"] || "Unknown"),
             email: String(item.email || item.Email || ""),
             phone: String(item.phone || item.Phone || item["Mobile Number"] || ""),
             institution: String(item.institution || item.Institution || item["Institution / College"] || ""),
             track: String(item.track || item.Track || item["Threat Sector"] || "General"),
             teamSize: String(item.teamSize || item["Team Size"] || item["Squad Size"] || "4"),
             memberNames: (() => {
                const raw = item.memberNames || item["Member Names"];
                if (Array.isArray(raw)) return raw.map(String);
                if (typeof raw === "string" && raw.trim() !== "") {
                  return raw.split("\\n").map((n: string) => n.replace(/^\\d+\\.\\s*/, "").trim()).filter(Boolean);
                }
                return [];
             })(),
             brief: String(item.brief || item.Brief || item["Mission Brief"] || ""),
             timestamp: String(item.timestamp || item.Timestamp || item["Registered At"] || new Date().toISOString()),
             checkedIn: Boolean(item.checkedIn || item.CheckedIn || String(item["Checked In"] || "").toUpperCase() === "YES"),
             status: item.status || "confirmed",
             paid: payInfo.paid !== undefined ? payInfo.paid : Boolean(item.paid || item.Paid || String(item["Paid"] || "").toUpperCase() === "YES"),
             paymentRef: payInfo.paymentRef !== undefined ? payInfo.paymentRef : (item.paymentRef ? String(item.paymentRef) : item["Payment Ref"] ? String(item["Payment Ref"]) : undefined),
             source: "remote",
             syncedToRemote: true,
           };
        });
        
        return jsonResponse(mapped, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }, request);
      }
      
      return jsonResponse({ error: "Invalid array from Sheets" }, 502, {}, request);
    } catch (err) {
      console.warn("Proxy GET error:", err);
      return jsonResponse({ error: "Upstream fetch failed" }, 502, {}, request);
    }
  }

  // ── POST: Mutations (Sheets Only) ──
  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const action = body["action"] as string | undefined;

      if (action && action !== "register" && !isAuthenticated) {
        return jsonResponse({ error: "Unauthorized" }, 401, {}, request);
      }

      const { url: _strippedUrl, ...actionPayload } = body;
      const targetUrl = (typeof body["url"] === "string" && body["url"].trim()) || SHEETS_WEBHOOK_URL;

      // Forward directly to Google Sheets Apps Script
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
      
      return jsonResponse({ success: true, from: "sheets-only" }, 200, {}, request);
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
  if (!authHeader || authHeader !== \`Bearer \${ADMIN_SECRET_TOKEN}\`) {
    return jsonResponse({ error: "Unauthorized" }, 401, {}, request);
  }

  const url = new URL(request.url);

  if (request.method === "GET") {
    const targetUrl = url.searchParams.get("url")?.trim() || PAYMENTS_WEBHOOK_URL;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const upstreamRes = await fetch(
        \`\${targetUrl}\${targetUrl.includes("?") ? "&" : "?"}_t=\${Date.now()}\`,
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
      const { action, id, paymentRef } = actionPayload as any;

      if (action === "markPaid" && (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim() === "")) {
         return jsonResponse({ error: "paymentRef is required" }, 400, {}, request);
      }

      // 1. Post to comms automation script (PAYMENTS_WEBHOOK_URL)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionPayload),
        signal: controller.signal,
        redirect: "follow",
      }).catch(err => console.error("Payment webhook failed:", err));
      clearTimeout(timeout);
      
      // 2. Post to Sheets script (SHEETS_WEBHOOK_URL) for backup
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
`;
fs.writeFileSync('src/server/proxy-handlers.ts', code);
console.log("Rewrote src/server/proxy-handlers.ts");
