/**
 * Server-side proxy and caching layer for Google Sheets & Payments Webhooks.
 *
 * Runs across Cloudflare Workers / Nitro SSR, Cloudflare Pages Functions,
 * and Vite dev server middleware.
 */

// These default fallbacks can be replaced by Vercel environment variables:
// process.env.SHEETS_WEBHOOK_URL
// process.env.PAYMENTS_WEBHOOK_URL
// process.env.ADMIN_SECRET_TOKEN

const DEFAULT_SHEETS_WEBHOOK_URL =
  process.env.SHEETS_WEBHOOK_URL ||
  "https://script.google.com/macros/s/AKfycbycYaGTT0ppofK5v8Fg15OCN7_gkKiMo9vMKKc9vtXezbenKvO2RCwA2v_shoTup8e2/exec";
const DEFAULT_PAYMENTS_WEBHOOK_URL =
  process.env.PAYMENTS_WEBHOOK_URL ||
  "https://script.google.com/macros/s/AKfycbxksTqZOBYTFQ1KtnYd1B-ZTsWrvJdVwIiYDGcElwZjQB4AQQ-lg_5fiXl_5h-CYBg_/exec";
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN || "zeroth-secure-token-xyz-987";

interface CacheRecord {
  body: string;
  contentType: string;
  status: number;
  timestamp: number;
}

// In-memory cache shared across concurrent requests within the isolate/process
const registrationsCache = new Map<string, CacheRecord>();
const paymentsCache = new Map<string, CacheRecord>();

const CACHE_TTL_MS = 6000; // 6 seconds cache window for fast sync & sheet reflection

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Requested-With",
};

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

/**
 * Handles GET / POST requests to /api/registrations
 */
export async function handleRegistrationsProxy(
  request: Request,
  _env?: unknown,
  _ctx?: unknown,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const authHeader = request.headers.get("Authorization");
  const isAuthenticated = authHeader === `Bearer ${ADMIN_SECRET_TOKEN}`;

  const url = new URL(request.url);

  // ── GET: Read cached registrations from Google Sheets (Admin Only) ──
  if (request.method === "GET") {
    if (!isAuthenticated) return jsonResponse({ error: "Unauthorized" }, 401);
    const targetUrl = url.searchParams.get("url")?.trim() || DEFAULT_SHEETS_WEBHOOK_URL;
    const bypassCache =
      url.searchParams.get("fresh") === "1" ||
      url.searchParams.get("bypass") === "1" ||
      request.headers.get("cache-control") === "no-cache";

    const cacheKey = targetUrl;
    const now = Date.now();

    // 1. Check in-memory cache
    if (!bypassCache) {
      const cached = registrationsCache.get(cacheKey);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return new Response(cached.body, {
          status: cached.status,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": cached.contentType,
            "X-Cache-Status": "HIT",
            "Cache-Control": "public, max-age=6, s-maxage=6, stale-while-revalidate=5",
          },
        });
      }
    } else {
      // Invalidate cache immediately on fresh request
      registrationsCache.delete(cacheKey);
    }

    // 2. Fetch upstream Google Sheets
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

      // Validate that upstream returned valid JSON
      try {
        JSON.parse(rawText);
        // Cache in-memory
        registrationsCache.set(cacheKey, {
          body: rawText,
          contentType: "application/json; charset=utf-8",
          status: 200,
          timestamp: now,
        });

        return new Response(rawText, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
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

      // Graceful fallback to stale cache if available
      const stale = registrationsCache.get(cacheKey);
      if (stale) {
        return new Response(stale.body, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
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
          message: err instanceof Error ? err.message : String(err),
        },
        502,
      );
    }
  }

  // ── POST: Write action (check-in, delete, insert) straight to Google Sheets ──
  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const action = body.action as string | undefined;
      
      // Protect admin actions, but allow public new registrations (where action is undefined or "register")
      if (action && action !== "register" && !isAuthenticated) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const targetUrl =
        (typeof body.url === "string" && body.url.trim()) || DEFAULT_SHEETS_WEBHOOK_URL;

      // Extract action payload without transport wrapper fields
      const { url: _strippedUrl, ...actionPayload } = body;

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

      // Invalidate cache immediately so subsequent reads fetch fresh data
      registrationsCache.delete(targetUrl);

      const responseText = await upstreamRes.text().catch(() => "");
      let responseJson: unknown = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      return jsonResponse({
        success: upstreamRes.ok,
        status: upstreamRes.status,
        result: responseJson,
      });
    } catch (err) {
      console.error("Registrations proxy POST error:", err);
      return jsonResponse(
        {
          success: false,
          error: "Failed to forward action to Google Sheets",
          message: err instanceof Error ? err.message : String(err),
        },
        500,
      );
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}

/**
 * Handles GET / POST requests to /api/payments
 */
export async function handlePaymentsProxy(
  request: Request,
  _env?: unknown,
  _ctx?: unknown,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET_TOKEN}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);

  // ── GET: Read payment statuses from comms automation script ──
  if (request.method === "GET") {
    const targetUrl = url.searchParams.get("url")?.trim() || DEFAULT_PAYMENTS_WEBHOOK_URL;
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
            ...CORS_HEADERS,
            "Content-Type": cached.contentType,
            "X-Cache-Status": "HIT",
            "Cache-Control": "public, max-age=6, s-maxage=6, stale-while-revalidate=5",
          },
        });
      }
    } else {
      // Invalidate cache immediately on fresh request
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
            ...CORS_HEADERS,
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
            ...CORS_HEADERS,
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
          message: err instanceof Error ? err.message : String(err),
        },
        502,
      );
    }
  }

  // ── POST: Mark payment and sync to remote comms script ──
  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const targetUrl =
        (typeof body.url === "string" && body.url.trim()) || DEFAULT_PAYMENTS_WEBHOOK_URL;

      const { url: _strippedUrl, ...actionPayload } = body;

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

      // Invalidate payment cache immediately
      paymentsCache.delete(targetUrl);

      const responseText = await upstreamRes.text().catch(() => "");
      let responseJson: unknown = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      return jsonResponse({
        success: upstreamRes.ok,
        status: upstreamRes.status,
        result: responseJson,
      });
    } catch (err) {
      console.error("Payments proxy POST error:", err);
      return jsonResponse(
        {
          success: false,
          error: "Failed to forward payment to remote script",
          message: err instanceof Error ? err.message : String(err),
        },
        500,
      );
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}
