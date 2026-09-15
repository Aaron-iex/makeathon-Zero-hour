import fs from 'fs';

const proxyCode = `/**
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
  const isAuthenticated = authHeader === \`Bearer \${ADMIN_SECRET_TOKEN}\`;

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

      const fetchSheets = fetch(\`\${SHEETS_WEBHOOK_URL}\${SHEETS_WEBHOOK_URL.includes("?") ? "&" : "?"}_t=\${now}\`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).then(r => {
        if (!r.ok) throw new Error(\`Sheets returned \${r.status}\`);
        return r.json();
      });

      const fetchPayments = PAYMENTS_WEBHOOK_URL ? fetch(\`\${PAYMENTS_WEBHOOK_URL}\${PAYMENTS_WEBHOOK_URL.includes("?") ? "&" : "?"}_t=\${now}\`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).then(r => {
        if (!r.ok) throw new Error(\`Payments returned \${r.status}\`);
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

      // Everything POSTed to /api/registrations now writes strictly to SHEETS_WEBHOOK_URL.
      const targetUrl = SHEETS_WEBHOOK_URL;
      const { url: _strippedUrl, ...actionPayload } = body;

      // Force delete payload to match script
      if (action === "delete") {
         actionPayload.action = "delete";
         // id is already present
      }

      // If array is passed, don't stringify it in proxy. We let fetch JSON.stringify it naturally below
      
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
      
      // Invalidate GET cache
      registrationsCache.delete("MERGED_REGISTRATIONS");

      const responseText = await upstreamRes.text().catch(() => "");
      let responseJson: unknown = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

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
      // Let it return 200 with success: false so the app can fallback.
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
`;

fs.writeFileSync('src/server/proxy-handlers.ts', proxyCode);
console.log("Rewrote proxy-handlers.ts");
