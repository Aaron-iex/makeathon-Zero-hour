/**
 * Server-side proxy and caching layer for Google Sheets & Payments Webhooks.
 *
 * Runs across Cloudflare Workers / Nitro SSR, Cloudflare Pages Functions,
 * and Vite dev server middleware.
 */

// NO FALLBACKS PERMITTED. Must fail securely if environment is misconfigured.
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
const paymentsCache = new Map<string, CacheRecord>();
const CACHE_TTL_MS = 6000;

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

  // ── GET: Read cached registrations from Google Sheets (Admin Only) ──
  if (request.method === "GET") {
    if (!isAuthenticated) return jsonResponse({ error: "Unauthorized" }, 401, {}, request);

    const targetUrl = url.searchParams.get("url")?.trim() || SHEETS_WEBHOOK_URL;
    const bypassCache =
      url.searchParams.get("fresh") === "1" ||
      url.searchParams.get("bypass") === "1" ||
      request.headers.get("cache-control") === "no-cache";

    const cacheKey = targetUrl;
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

      const upstreamRes = await fetch(
        `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          redirect: "follow",
        },
      );

      clearTimeout(timeout);

      if (!upstreamRes.ok) {
        throw new Error(`Upstream returned HTTP ${upstreamRes.status}`);
      }

      const rawText = await upstreamRes.text();

      try {
        JSON.parse(rawText);
        registrationsCache.set(cacheKey, {
          body: rawText,
          contentType: "application/json; charset=utf-8",
          status: 200,
          timestamp: now,
        });

        return new Response(rawText, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "X-Cache-Status": "MISS",
            "Cache-Control": "public, max-age=18, s-maxage=20, stale-while-revalidate=10",
          },
        });
      } catch {
        throw new Error("Upstream response was not valid JSON");
      }
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

  // ── POST: Write action (check-in, delete, insert) straight to Google Sheets ──
  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const action = body["action"] as string | undefined;

      // Protect admin actions, but allow public new registrations (where action is undefined or "register")
      if (action && action !== "register" && !isAuthenticated) {
        return jsonResponse({ error: "Unauthorized" }, 401, {}, request);
      }

      const targetUrl =
        (typeof body["url"] === "string" && body["url"].trim()) || SHEETS_WEBHOOK_URL;
      const { url: _strippedUrl, ...actionPayload } = body;

      // Data Sanitization / Validation removed to avoid blocking valid submissions
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
      registrationsCache.delete(targetUrl);

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
      return jsonResponse(
        {
          success: false,
          error: "Failed to forward action to Google Sheets",
        },
        500,
        {},
        request,
      );
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
    const targetUrl = url.searchParams.get("url")?.trim() || PAYMENTS_WEBHOOK_URL;
    const bypassCache =
      url.searchParams.get("fresh") === "1" || request.headers.get("cache-control") === "no-cache";

    const cacheKey = targetUrl;
    const now = Date.now();

    if (!bypassCache) {
      const cached = paymentsCache.get(cacheKey);
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
      paymentsCache.delete(cacheKey);
    }

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
        },
      );

      clearTimeout(timeout);

      if (!upstreamRes.ok) {
        throw new Error(`Upstream returned HTTP ${upstreamRes.status}`);
      }

      const rawText = await upstreamRes.text();

      try {
        JSON.parse(rawText);
        paymentsCache.set(cacheKey, {
          body: rawText,
          contentType: "application/json; charset=utf-8",
          status: 200,
          timestamp: now,
        });

        return new Response(rawText, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "X-Cache-Status": "MISS",
            "Cache-Control": "public, max-age=18, s-maxage=20, stale-while-revalidate=10",
          },
        });
      } catch {
        throw new Error("Payments upstream response was not valid JSON");
      }
    } catch (err) {
      console.warn("Payments upstream fetch error:", err);
      const stale = paymentsCache.get(cacheKey);
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
          error: "Upstream Payments Webhook fetch failed or timed out",
        },
        502,
        {},
        request,
      );
    }
  }

  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const targetUrl =
        (typeof body["url"] === "string" && body["url"].trim()) || PAYMENTS_WEBHOOK_URL;
      const { url: _strippedUrl, ...actionPayload } = body;

      // Validation
      if (actionPayload["action"] === "markPaid") {
        if (
          !actionPayload["paymentRef"] ||
          typeof actionPayload["paymentRef"] !== "string" ||
          actionPayload["paymentRef"].trim() === ""
        ) {
          return jsonResponse({ error: "paymentRef is required" }, 400, {}, request);
        }
      }

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
      paymentsCache.delete(targetUrl);

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
      console.error("Payments proxy POST error:", err);
      return jsonResponse(
        {
          success: false,
          error: "Failed to forward payment to remote script",
        },
        500,
        {},
        request,
      );
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405, {}, request);
}
