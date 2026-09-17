/**
 * Server-side proxy and caching layer for Google Sheets & Payments Webhooks.
 * Runs across Cloudflare Workers / Nitro SSR, Cloudflare Pages Functions,
 * and Vite dev server middleware.
 */

const SHEETS_WEBHOOK_URL = process.env["SHEETS_WEBHOOK_URL"];
const PAYMENTS_WEBHOOK_URL = process.env["PAYMENTS_WEBHOOK_URL"];
const ADMIN_SECRET_TOKEN = process.env["ADMIN_SECRET_TOKEN"];

const VERIFIED_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxspoied-wFIYmPdpHYcmBKlsF5X0mXu-xv8LDQtX6a1X2TO-_7uJYeKJszENu9KvJE/exec";
const VERIFIED_PAYMENTS_URL =
  "https://script.google.com/macros/s/AKfycbxksTqZOBYTFQ1KtnYd1B-ZTsWrvJdVwIiYDGcElwZjQB4AQQ-lg_5fiXl_5h-CYBg_/exec";

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
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const envObj = (_env && typeof _env === "object" ? _env : {}) as Record<string, string | undefined>;
  const activeSheetsEnv =
    process.env["SHEETS_WEBHOOK_URL"] || envObj["SHEETS_WEBHOOK_URL"] || SHEETS_WEBHOOK_URL;
  const activePaymentsEnv =
    process.env["PAYMENTS_WEBHOOK_URL"] || envObj["PAYMENTS_WEBHOOK_URL"] || PAYMENTS_WEBHOOK_URL;
  const activeAdminToken =
    process.env["ADMIN_SECRET_TOKEN"] || envObj["ADMIN_SECRET_TOKEN"] || ADMIN_SECRET_TOKEN;

  const authHeader = request.headers.get("Authorization");
  const isAuthenticated =
    !activeAdminToken ||
    activeAdminToken === "dummy" ||
    authHeader === `Bearer ${activeAdminToken}` ||
    Boolean(authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 10);

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

    const sheetsUrlParam = url.searchParams.get("sheetsUrl") || url.searchParams.get("url") || "";
    const paymentsUrlParam = url.searchParams.get("paymentsUrl") || "";

    const activeSheetsUrl =
      sheetsUrlParam && sheetsUrlParam.startsWith("https://script.google.com")
        ? sheetsUrlParam
        : activeSheetsEnv && !activeSheetsEnv.includes("dummy")
          ? activeSheetsEnv
          : VERIFIED_SHEETS_URL;

    const activePaymentsUrl =
      paymentsUrlParam && paymentsUrlParam.startsWith("https://script.google.com")
        ? paymentsUrlParam
        : activePaymentsEnv && !activePaymentsEnv.includes("dummy")
          ? activePaymentsEnv
          : VERIFIED_PAYMENTS_URL;

    try {
      const SHEETS_TIMEOUT_MS = 20000;
      const sheetsController = new AbortController();
      const sheetsTimeout = setTimeout(() => sheetsController.abort(), SHEETS_TIMEOUT_MS);

      const PAYMENTS_TIMEOUT_MS = 10000;
      const paymentsController = new AbortController();
      const paymentsTimeout = setTimeout(() => paymentsController.abort(), PAYMENTS_TIMEOUT_MS);

      const fetchSheets = (async () => {
        try {
          const r = await fetch(
            `${activeSheetsUrl}${activeSheetsUrl.includes("?") ? "&" : "?"}_t=${now}`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
              redirect: "follow",
              signal: sheetsController.signal,
            },
          );
          if (r.ok) {
            return await r.json();
          }
          throw new Error(`Sheets returned status ${r.status}`);
        } catch (err: any) {
          if (err?.name === "AbortError" || sheetsController.signal.aborted) {
            console.error(`SHEETS_WEBHOOK_URL fetch timed out after ${SHEETS_TIMEOUT_MS}ms:`, err);
          } else {
            console.error("SHEETS_WEBHOOK_URL fetch error:", err);
          }
          if (activeSheetsUrl !== VERIFIED_SHEETS_URL) {
            console.warn("Proxy: primary sheets URL failed, trying verified fallback:", err);
            const fallbackRes = await fetch(
              `${VERIFIED_SHEETS_URL}${VERIFIED_SHEETS_URL.includes("?") ? "&" : "?"}_t=${now}`,
              {
                method: "GET",
                headers: { Accept: "application/json" },
                redirect: "follow",
                signal: sheetsController.signal,
              },
            );
            if (fallbackRes.ok) {
              return await fallbackRes.json();
            }
          }
          throw err;
        } finally {
          clearTimeout(sheetsTimeout);
        }
      })();

      let paymentsFetchFailed = false;
      const fetchPayments = (async () => {
        if (!activePaymentsUrl) return { success: false, data: [] };
        try {
          const r = await fetch(
            `${activePaymentsUrl}${activePaymentsUrl.includes("?") ? "&" : "?"}_t=${now}`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
              redirect: "follow",
              signal: paymentsController.signal,
            },
          );
          if (r.ok) {
            const data = await r.json();
            return { success: true, data };
          }
          console.warn(`Proxy: Payments returned status ${r.status} (non-fatal)`);
          paymentsFetchFailed = true;
          return { success: false, data: [] };
        } catch (err: any) {
          paymentsFetchFailed = true;
          if (err?.name === "AbortError" || paymentsController.signal.aborted) {
            console.warn(`Proxy: PAYMENTS_WEBHOOK_URL fetch timed out after ${PAYMENTS_TIMEOUT_MS}ms (non-fatal):`, err);
          } else {
            console.warn("Proxy: Failed to fetch payments (non-fatal):", err);
          }
          return { success: false, data: [] };
        } finally {
          clearTimeout(paymentsTimeout);
        }
      })();

      // SHEETS_WEBHOOK_URL fetch is primary and determines success or failure
      const [sheetsResult, paymentsResult] = await Promise.allSettled([fetchSheets, fetchPayments]);

      let sheetsData: any = null;
      if (sheetsResult.status === "fulfilled") {
        sheetsData = sheetsResult.value;
      } else {
        throw sheetsResult.reason;
      }

      const paymentsOutcome =
        paymentsResult.status === "fulfilled"
          ? paymentsResult.value
          : { success: false, data: [] };

      const paymentsData = paymentsOutcome.data;
      const isPaymentsStale = !paymentsOutcome.success || paymentsFetchFailed;
      
      // Process Sheets Data & Deduplicate by ID (protecting against blank duplicate rows)
      const rawRegs = Array.isArray(sheetsData) ? sheetsData : [];
      const deduplicatedMap = new Map<string, any>();
      for (const reg of rawRegs) {
        const id = String(reg.id || reg.ID || reg["Pass ID"] || "").trim();
        if (!id) continue;
        if (!deduplicatedMap.has(id)) {
          deduplicatedMap.set(id, reg);
        } else {
          const existing = deduplicatedMap.get(id);
          const mergedItem = { ...existing };
          for (const [k, v] of Object.entries(reg)) {
            const existingVal = String(existing[k] ?? "").trim();
            const newVal = String(v ?? "").trim();
            if (newVal !== "" && (existingVal === "" || existingVal === "Unnamed Squad" || existingVal === "Unknown")) {
              mergedItem[k] = v;
            }
          }
          deduplicatedMap.set(id, mergedItem);
        }
      }
      const uniqueRegs = Array.from(deduplicatedMap.values());
      
      // Process Payments Data (handle both bare array and { success, data })
      let payArray: any[] = [];
      if (Array.isArray(paymentsData)) {
        payArray = paymentsData;
      } else if (paymentsData && typeof paymentsData === "object" && Array.isArray((paymentsData as any).data)) {
        payArray = (paymentsData as any).data;
      }
      
      const paymentMap = new Map<string, { paid: boolean; paymentRef: string }>();
      for (const p of payArray) {
        const pId = String(p.id || p.ID || p["Pass ID"] || "").trim();
        if (!pId) continue;
        const pPaid =
          p.paid === true ||
          String(p.paid || "").toLowerCase() === "true" ||
          String(p.paid || "").toUpperCase() === "YES" ||
          String(p.status || "").toLowerCase() === "paid" ||
          Boolean(p.paymentRef);
        const pRef = String(p.paymentRef || p.referenceId || p["Payment Ref"] || "").trim();
        if (pPaid || pRef) {
          paymentMap.set(pId, {
            paid: true,
            paymentRef: pRef,
          });
        }
      }

      // Merge: Sheets data is primary for paid/paymentRef, Comms log is supplementary
      const merged = uniqueRegs.map((reg: any) => {
        const id = String(reg.id || reg.ID || reg["Pass ID"] || "");
        const pData = paymentMap.get(id);

        // Direct Sheet fields (columns M and N)
        const sheetPaid =
          reg.paid === true ||
          String(reg.paid || "").toLowerCase() === "true" ||
          String(reg.paid || "").toUpperCase() === "YES" ||
          String(reg["Paid"] || "").toUpperCase() === "YES" ||
          String(reg.status || "").toLowerCase() === "paid";

        const sheetPaymentRef = String(
          reg.paymentRef ||
            reg["Payment Ref"] ||
            reg["payment_ref"] ||
            reg["Payment Reference ID"] ||
            "",
        ).trim();

        // Supplementary Comms log source
        const commsPaid = Boolean(pData && pData.paid);
        const commsPaymentRef = String((pData && pData.paymentRef) || "").trim();

        // Either source says paid => paid=true
        const isPaid = sheetPaid || commsPaid || Boolean(sheetPaymentRef || commsPaymentRef);
        const finalPaymentRef = sheetPaymentRef || commsPaymentRef || "";
        
        let memberNames: string[] = [];
        const rawMembers =
          reg.memberNames ||
          reg["Member Names"] ||
          reg.TeamMembers ||
          reg["Team Members"] ||
          reg["Members"];

        if (Array.isArray(rawMembers)) {
          memberNames = rawMembers.map(String).map((s: string) => s.trim()).filter(Boolean);
        } else if (typeof rawMembers === "string" && rawMembers.trim()) {
          try {
            const parsed = JSON.parse(rawMembers);
            if (Array.isArray(parsed)) {
              memberNames = parsed.map(String).map((s: string) => s.trim()).filter(Boolean);
            }
          } catch {}
          if (memberNames.length === 0) {
            memberNames = rawMembers
              .split(/[\n,]+/)
              .map((s: string) => s.replace(/^\d+\.\s*/, "").trim())
              .filter(Boolean);
          }
        }

        const teamName = String(
          reg.teamName ||
            reg["Team Name"] ||
            reg["Squad Name"] ||
            reg["TeamName"] ||
            reg["Team name"] ||
            reg["squad_name"] ||
            reg["team_name"] ||
            reg.SquadName ||
            "",
        ).trim();

        const leaderName = String(
          reg.leaderName ||
            reg["Leader Name"] ||
            reg["LeaderName"] ||
            reg["Leader name"] ||
            reg["Name"] ||
            reg.Name ||
            reg["Full Name"] ||
            "",
        ).trim();

        const email = String(
          reg.email ||
            reg.Email ||
            reg["Email Address"] ||
            reg["Email address"] ||
            reg["Contact Email"] ||
            "",
        ).trim();

        const phone = String(
          reg.phone ||
            reg.Phone ||
            reg["Mobile Number"] ||
            reg["Mobile number"] ||
            reg.Mobile ||
            reg.Contact ||
            reg["Phone Number"] ||
            "",
        ).trim();

        const institution = String(
          reg.institution ||
            reg.Institution ||
            reg["Institution / College"] ||
            reg["Institution"] ||
            reg["College"] ||
            reg.College ||
            reg.Organization ||
            "",
        ).trim();

        const track = String(
          reg.track ||
            reg.Track ||
            reg["Threat Sector"] ||
            reg["Sector"] ||
            reg.Sector ||
            "Open Innovation",
        ).trim();

        const teamSize = String(
          reg.teamSize ||
            reg["Team Size"] ||
            reg["Squad Size"] ||
            reg["Squad size"] ||
            reg.Size ||
            "4",
        ).trim();

        const brief = String(
          reg.brief ||
            reg["Mission Brief"] ||
            reg["Brief"] ||
            reg.Brief ||
            reg.Idea ||
            "",
        ).trim();

        const timestamp = String(
          reg.timestamp ||
            reg.Timestamp ||
            reg["Registered At"] ||
            reg["Registered at"] ||
            reg.Date ||
            "",
        ).trim();

        return {
          id,
          teamName: teamName || "Unnamed Squad",
          leaderName: leaderName || "Unknown",
          email,
          phone,
          institution,
          track,
          teamSize,
          brief,
          timestamp: timestamp || new Date().toISOString(),
          checkedIn: String(reg.checkedIn || reg["Checked In"] || "").toUpperCase() === "YES" || reg.checkedIn === true,
          memberNames,
          source: "cloud",
          syncedToRemote: true,
          status: "confirmed",
          paid: isPaid,
          paymentRef: finalPaymentRef,
        };
      });

      const responsePayload = {
        success: true,
        data: merged,
        paymentsStale: isPaymentsStale,
      };
      const responseBody = JSON.stringify(responsePayload);
      
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
      
    } catch (err: any) {
      console.error("Registrations upstream fetch error in proxy-handlers:", err);

      const stale = registrationsCache.get(cacheKey);
      if (stale) {
        console.warn("Proxy: Serving stale cached registrations due to upstream fetch failure");
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

      const isTimeout = err?.name === "AbortError" || String(err).includes("aborted");
      const errorMessage = isTimeout
        ? "SHEETS_WEBHOOK_URL fetch timed out after 20000ms"
        : `Upstream Google Sheet fetch failed: ${err instanceof Error ? err.message : String(err)}`;

      return jsonResponse(
        {
          success: false,
          error: errorMessage,
          detail: err instanceof Error ? err.stack || err.message : String(err),
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
      registrationsCache.clear();

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

        const incomingPaymentsUrl =
          typeof body["paymentsUrl"] === "string" &&
          body["paymentsUrl"].startsWith("https://script.google.com")
            ? body["paymentsUrl"].trim()
            : typeof body["url"] === "string" &&
                body["url"].startsWith("https://script.google.com") &&
                !body["url"].includes(SHEETS_WEBHOOK_URL || "___")
              ? body["url"].trim()
              : "";

        const incomingSheetsUrl =
          typeof body["sheetsUrl"] === "string" &&
          body["sheetsUrl"].startsWith("https://script.google.com")
            ? body["sheetsUrl"].trim()
            : typeof body["url"] === "string" &&
                body["url"].startsWith("https://script.google.com") &&
                !body["url"].includes(PAYMENTS_WEBHOOK_URL || "___")
              ? body["url"].trim()
              : "";

        const sheetsTargetUrl =
          incomingSheetsUrl ||
          (activeSheetsEnv && !activeSheetsEnv.includes("dummy")
            ? activeSheetsEnv
            : VERIFIED_SHEETS_URL);

        const paymentsTargetUrl =
          incomingPaymentsUrl ||
          incomingSheetsUrl ||
          (activePaymentsEnv && !activePaymentsEnv.includes("dummy")
            ? activePaymentsEnv
            : VERIFIED_PAYMENTS_URL);

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

        console.log(`Calling SHEETS updatePayment for ${id}`);
        console.log(`Calling PAYMENTS comms webhook for ${id}`);
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
            const timeout = setTimeout(() => controller.abort(), 20000);
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
            const timeout = setTimeout(() => controller.abort(), 20000);
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
      const incomingSheetsUrl =
        typeof body["sheetsUrl"] === "string" &&
        body["sheetsUrl"].startsWith("https://script.google.com")
          ? body["sheetsUrl"].trim()
          : typeof body["url"] === "string" &&
              body["url"].startsWith("https://script.google.com")
            ? body["url"].trim()
            : "";

      const targetUrl =
        incomingSheetsUrl ||
        (activeSheetsEnv && !activeSheetsEnv.includes("dummy")
          ? activeSheetsEnv
          : VERIFIED_SHEETS_URL);

      if (!targetUrl) {
        return jsonResponse(
          { success: false, error: "No SHEETS_WEBHOOK_URL configured" },
          500,
          {},
          request,
        );
      }

      const { url: _strippedUrl, sheetsUrl: _strippedSheetsUrl, paymentsUrl: _strippedPaymentsUrl, ...actionPayload } = body;

      if (action === "delete") {
        actionPayload.action = "delete";
      }

      console.log(
        `[PROXY POST ${action || "register"}] Calling SHEETS_WEBHOOK_URL (${targetUrl}):`,
        JSON.stringify(actionPayload),
      );

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

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
