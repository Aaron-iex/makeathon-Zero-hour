/**
 * Server-side proxy and caching layer for Google Sheets & Payments Webhooks.
 * Runs across Cloudflare Workers / Nitro SSR, Cloudflare Pages Functions,
 * and Vite dev server middleware.
 */

const SHEETS_WEBHOOK_URL = process.env["SHEETS_WEBHOOK_URL"];
const PAYMENTS_WEBHOOK_URL = process.env["PAYMENTS_WEBHOOK_URL"];
const ADMIN_SECRET_TOKEN = process.env["ADMIN_SECRET_TOKEN"];

interface CacheRecord {
  body: string;
  contentType: string;
  status: number;
  timestamp: number;
}

const registrationsCache = new Map<string, CacheRecord>();
const CACHE_TTL_MS = 8000;

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
  extraHeaders: Record<string, string> = {},
  request?: Request,
) {
  const headers = request
    ? { ...getCorsHeaders(request), "Content-Type": "application/json", ...extraHeaders }
    : { "Content-Type": "application/json", ...extraHeaders };
  return new Response(JSON.stringify(data), { status, headers });
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

  // ── GET: Read and merge from both Webhooks ──
  if (request.method === "GET") {
    if (!isAuthenticated) return jsonResponse({ error: "Unauthorized" }, 401, {}, request);

    const bypassCache =
      url.searchParams.get("fresh") === "1" ||
      url.searchParams.get("bypass") === "1" ||
      request.headers.get("cache-control") === "no-cache";

    const cacheKey = "MERGED_REGISTRATIONS";
    const now = Date.now();

    if (!bypassCache) {
      const cached = registrationsCache.get(cacheKey);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return new Response(cached.body, {
          status: cached.status,
          headers: {
            ...corsHeaders,
            "Content-Type": cached.contentType,
            "X-Cache-Status": "HIT",
            "Cache-Control": "public, max-age=6, s-maxage=6, stale-while-revalidate=5",
          },
        });
      }
    } else {
      registrationsCache.delete(cacheKey);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const fetchSheets = fetch(`${SHEETS_WEBHOOK_URL}${SHEETS_WEBHOOK_URL.includes("?") ? "&" : "?"}_t=${now}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).then(r => {
        if (!r.ok) throw new Error(`Sheets returned ${r.status}`);
        return r.json();
      });

      const fetchPayments = PAYMENTS_WEBHOOK_URL ? fetch(`${PAYMENTS_WEBHOOK_URL}${PAYMENTS_WEBHOOK_URL.includes("?") ? "&" : "?"}_t=${now}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).then(r => {
        if (!r.ok) throw new Error(`Payments returned ${r.status}`);
        return r.json();
      }).catch(err => {
        console.warn("Proxy: Failed to fetch payments:", err);
        return [];
      }) : Promise.resolve([]);

      const [sheetsData, paymentsData] = await Promise.all([fetchSheets, fetchPayments]);
      clearTimeout(timeout);
      
      // Process Sheets Data
      const rawRegs = Array.isArray(sheetsData) ? sheetsData : [];
      
      // Process Payments Data (handle both bare array and { success, data })
      let payArray: any[] = [];
      if (Array.isArray(paymentsData)) {
        payArray = paymentsData;
      } else if (paymentsData && Array.isArray(paymentsData.data)) {
        payArray = paymentsData.data;
      }
      
      const paymentMap = new Map<string, { paid: boolean, paymentRef: string }>();
      for (const p of payArray) {
        if (p.id) {
          paymentMap.set(String(p.id), {
             paid: true,
             paymentRef: p.paymentRef || ""
          });
        }
      }

      // Merge
      const merged = rawRegs.map((reg: any) => {
        const id = String(reg.id || reg.ID || "");
        const pData = paymentMap.get(id);
        
        let memberNames: string[] = [];
        if (Array.isArray(reg.memberNames)) {
          memberNames = reg.memberNames;
        } else if (typeof reg.memberNames === "string") {
          memberNames = reg.memberNames.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (typeof reg.TeamMembers === "string") {
          memberNames = reg.TeamMembers.split(",").map((s: string) => s.trim()).filter(Boolean);
        }

        return {
          id,
          teamName: String(reg.teamName || reg["Team Name"] || ""),
          leaderName: String(reg.leaderName || reg["Leader Name"] || ""),
          email: String(reg.email || reg.Email || ""),
          phone: String(reg.phone || reg["Mobile Number"] || ""),
          institution: String(reg.institution || reg.Institution || ""),
          track: String(reg.track || reg.Track || reg["Threat Sector"] || ""),
          teamSize: String(reg.teamSize || reg["Team Size"] || reg["Squad Size"] || "4"),
          brief: String(reg.brief || reg["Mission Brief"] || ""),
          timestamp: String(reg.timestamp || reg.Timestamp || reg["Registered At"] || ""),
          checkedIn: String(reg.checkedIn || reg["Checked In"] || "").toUpperCase() === "YES" || reg.checkedIn === true,
          memberNames,
          source: "cloud",
          syncedToRemote: true,
          status: "confirmed",
          paid: pData ? pData.paid : false,
          paymentRef: pData ? pData.paymentRef : ""
        };
      });

      const responseBody = JSON.stringify(merged);
      
      registrationsCache.set(cacheKey, {
        body: responseBody,
        contentType: "application/json; charset=utf-8",
        status: 200,
        timestamp: now,
      });

      return new Response(responseBody, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "X-Cache-Status": "MISS",
          "Cache-Control": "public, max-age=6, s-maxage=6, stale-while-revalidate=5",
        },
      });
      
    } catch (err) {
      console.warn("Registrations upstream fetch error:", err);

      const stale = registrationsCache.get(cacheKey);
      if (stale) {
        return new Response(stale.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": stale.contentType,
            "X-Cache-Status": "STALE-FALLBACK",
            "Cache-Control": "no-cache",
          },
        });
      }

      return jsonResponse(
        {
          success: false,
          error: "Upstream Google Sheet fetch failed or timed out",
        },
        502,
        {},
        request,
      );
    }
  }

  // ── POST: Write actions ──
  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const action = body["action"] as string | undefined;

      if (action && action !== "register" && !isAuthenticated) {
        return jsonResponse({ error: "Unauthorized" }, 401, {}, request);
      }

      // Invalidate GET cache immediately upon any write action
      registrationsCache.delete("MERGED_REGISTRATIONS");

      const id = String(body["id"] || "");
      const isPaymentAction =
        action === "markPaid" ||
        action === "markUnpaid" ||
        action === "updatePayment";

      // ── SPECIAL DUAL-WRITE DISPATCH FOR PAYMENTS ──
      // When payment is updated, call BOTH:
      // (a) SHEETS_WEBHOOK_URL to update the Google Sheet backup.
      // (b) PAYMENTS_WEBHOOK_URL to trigger acceptance + OD proof email from makeathonzerothhour@gmail.com.
      if (isPaymentAction) {
        const isPaid =
          action === "markPaid" ||
          (action === "updatePayment" &&
            (body["paid"] === true ||
              String(body["paid"]).toLowerCase() === "true" ||
              String(body["paid"]).toUpperCase() === "YES"));

        const paymentRef =
          typeof body["paymentRef"] === "string" ? body["paymentRef"].trim() : "";
        const email = typeof body["email"] === "string" ? body["email"].trim() : "";
        const leaderName =
          typeof body["leaderName"] === "string" ? body["leaderName"].trim() : "";
        const teamName =
          typeof body["teamName"] === "string" ? body["teamName"].trim() : "";

        const sheetsTargetUrl = SHEETS_WEBHOOK_URL;
        const paymentsTargetUrl = PAYMENTS_WEBHOOK_URL;

        // 1. Sheets Webhook Payload (writes to Registrations Google Sheet)
        const sheetPayload = {
          action: "updatePayment",
          id,
          paid: isPaid,
          paymentRef: isPaid ? paymentRef : "",
        };

        // 2. Comms Webhook Payload (writes to Payments tab & sends confirmation email)
        const paymentsPayload = {
          id,
          email,
          paymentRef: isPaid ? paymentRef : "",
          leaderName,
          teamName,
          action: isPaid ? "markPaid" : "markUnpaid",
          paid: isPaid,
        };

        console.log(
          `[PROXY POST ${action}] Calling SHEETS_WEBHOOK_URL (${sheetsTargetUrl}):`,
          JSON.stringify(sheetPayload),
        );
        console.log(
          `[PROXY POST ${action}] Calling PAYMENTS_WEBHOOK_URL (${paymentsTargetUrl}):`,
          JSON.stringify(paymentsPayload),
        );

        // Call (a): Primary Google Sheets Webhook
        const sheetCall = (async () => {
          if (!sheetsTargetUrl) {
            console.warn("[PROXY POST updatePayment] SHEETS_WEBHOOK_URL not configured");
            return { success: false, error: "No SHEETS_WEBHOOK_URL configured" };
          }
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(sheetsTargetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sheetPayload),
              signal: controller.signal,
              redirect: "follow",
            });
            clearTimeout(timeout);
            const text = await res.text().catch(() => "");
            let json: unknown = null;
            try {
              json = JSON.parse(text);
            } catch {
              json = { raw: text };
            }
            console.log(
              `[PROXY POST ${action}] SHEETS response (status ${res.status}):`,
              JSON.stringify(json),
            );
            return { success: res.ok, status: res.status, result: json };
          } catch (err) {
            console.error(`[PROXY POST ${action}] Error calling SHEETS_WEBHOOK_URL:`, err);
            return { success: false, error: String(err) };
          }
        })();

        // Call (b): Comms Automation Webhook (makeathonzerothhour@gmail.com)
        const paymentsCall = (async () => {
          if (!paymentsTargetUrl) {
            console.warn(
              `[PROXY POST ${action}] PAYMENTS_WEBHOOK_URL not configured, skipping comms trigger`,
            );
            return { success: false, skipped: true, error: "No PAYMENTS_WEBHOOK_URL configured" };
          }
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(paymentsTargetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentsPayload),
              signal: controller.signal,
              redirect: "follow",
            });
            clearTimeout(timeout);
            const text = await res.text().catch(() => "");
            let json: unknown = null;
            try {
              json = JSON.parse(text);
            } catch {
              json = { raw: text };
            }
            console.log(
              `[PROXY POST ${action}] PAYMENTS/COMMS response (status ${res.status}):`,
              JSON.stringify(json),
            );
            return { success: res.ok, status: res.status, result: json };
          } catch (err) {
            console.error(`[PROXY POST ${action}] Error calling PAYMENTS_WEBHOOK_URL:`, err);
            return { success: false, error: String(err) };
          }
        })();

        const [sheetResult, paymentsResult] = await Promise.allSettled([sheetCall, paymentsCall]);

        return jsonResponse(
          {
            success: true,
            status: 200,
            sheetResult:
              sheetResult.status === "fulfilled"
                ? sheetResult.value
                : { error: String(sheetResult.reason) },
            paymentsResult:
              paymentsResult.status === "fulfilled"
                ? paymentsResult.value
                : { error: String(paymentsResult.reason) },
          },
          200,
          {},
          request,
        );
      }

      // Other actions: updateCheckIn, updateMemberNames, delete, register
      const targetUrl = SHEETS_WEBHOOK_URL;
      const { url: _strippedUrl, ...actionPayload } = body;

      if (action === "delete") {
        actionPayload.action = "delete";
      }

      console.log(
        `[PROXY POST ${action || "register"}] Calling SHEETS_WEBHOOK_URL (${targetUrl}):`,
        JSON.stringify(actionPayload),
      );

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

      const responseText = await upstreamRes.text().catch(() => "");
      let responseJson: unknown = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      console.log(
        `[PROXY POST ${action || "register"}] SHEETS response (status ${upstreamRes.status}):`,
        JSON.stringify(responseJson),
      );

      return jsonResponse(
        {
          success: upstreamRes.ok,
          status: upstreamRes.status,
          result: responseJson,
        },
        200,
        {},
        request,
      );
    } catch (err) {
      console.error("Registrations proxy POST error:", err);
      return jsonResponse(
        {
          success: false,
          error: "Failed to forward action to Google Sheets",
        },
        200,
        {},
        request,
      );
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405, {}, request);
}
