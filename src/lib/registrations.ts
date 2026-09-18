export interface Registration {
  id: string;
  teamName: string;
  leaderName: string;
  email: string;
  phone: string;
  institution: string;
  track: string;
  teamSize: string;
  memberNames?: string[];
  brief?: string;
  timestamp: string;
  checkedIn?: boolean;
  status?: "confirmed" | "pending" | "waitlist";
  paid?: boolean;
  paymentRef?: string;
  source?: "remote" | "local";
  syncedToRemote?: boolean;
  lastLocalEdit?: number;
}

export interface SubmissionResult {
  id: string;
  cloudSuccess: boolean;
  fallbackUrl?: string;
}

const STORAGE_KEY = "zeroth_hour_registrations";
const SHEETS_URL_KEY = "zeroth_hour_sheets_url";
const PAYMENTS_URL_KEY = "zeroth_hour_payments_url";

// 1. Dedicated Backup Form URL (Triggered on Server Busy / Failure)
export const BACKUP_GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeHexFdyOA0gRSkF2WA6YzSTDnwupO-c0VkXw7EzdG3vZ762g/viewform";

// 2. Dual-Sync Automated Background Google Form (https://forms.gle/2EKyiYHmae8oWEtf7)
export const DUAL_SYNC_GOOGLE_FORM_RESPONSE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeJ1VCfZRwyTOXMK2R4NXnD8_i1Kl7m0AEakBvAsxZ0OsGS1Q/formResponse";

export function getStoredRegistrations(): Registration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading registrations:", e);
    return [];
  }
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("zeroth_admin_token") ||
    sessionStorage.getItem("zeroth_admin_token") ||
    ""
  );
}

export function saveAllRegistrations(list: Registration[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(list);
    localStorage.setItem(STORAGE_KEY, serialized);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event("zeroth_registration_updated"));
  } catch (e) {
    console.error("Error saving registrations:", e);
  }
}

export function clearStoredRegistrations(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("zeroth_registration_updated"));
  } catch (e) {
    console.error("Error clearing stored registrations:", e);
  }
}

export function saveRegistrationLocally(reg: Registration): void {
  if (typeof window === "undefined") return;
  const current = getStoredRegistrations();
  const existingIdx = current.findIndex((r) => r.id === reg.id);
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...reg };
  } else {
    current.unshift(reg);
  }
  saveAllRegistrations(current);
}

export function deleteRegistrationLocally(id: string): void {
  if (typeof window === "undefined") return;
  const current = getStoredRegistrations();
  const filtered = current.filter((r) => r.id !== id);
  saveAllRegistrations(filtered);
}

export const DEFAULT_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxspoied-wFIYmPdpHYcmBKlsF5X0mXu-xv8LDQtX6a1X2TO-_7uJYeKJszENu9KvJE/exec";

export function getGoogleSheetsWebhookUrl(): string {
  if (typeof window === "undefined") return DEFAULT_SHEETS_WEBHOOK_URL;
  const saved = localStorage.getItem(SHEETS_URL_KEY);
  if (saved && saved.startsWith("https://script.google.com")) {
    return saved.trim();
  }
  return DEFAULT_SHEETS_WEBHOOK_URL;
}

export function setGoogleSheetsWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHEETS_URL_KEY, url.trim());
}

export const DEFAULT_PAYMENTS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxksTqZOBYTFQ1KtnYd1B-ZTsWrvJdVwIiYDGcElwZjQB4AQQ-lg_5fiXl_5h-CYBg_/exec";

export function getPaymentsWebhookUrl(): string {
  if (typeof window === "undefined") return DEFAULT_PAYMENTS_WEBHOOK_URL;
  const saved = localStorage.getItem(PAYMENTS_URL_KEY);
  if (saved && saved.startsWith("https://script.google.com")) {
    return saved.trim();
  }
  return DEFAULT_PAYMENTS_WEBHOOK_URL;
}

export function setPaymentsWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAYMENTS_URL_KEY, url.trim());
}

/**
 * Syncs a new squad creation to Google Sheets via caching proxy (with direct fallback)
 */
export async function syncAddSquadToRemote(reg: Registration): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  const payload = {
    action: "register",
    id: reg.id,
    teamName: reg.teamName,
    leaderName: reg.leaderName,
    email: reg.email,
    phone: reg.phone,
    institution: reg.institution,
    track: reg.track,
    teamSize: reg.teamSize || "4",
    brief: reg.brief || "",
    timestamp: reg.timestamp,
    checkedIn: reg.checkedIn,
    memberNames: reg.memberNames || [],
    sheetsUrl: webhookUrl,
    url: webhookUrl,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (data && data.success !== false) {
        return true;
      }
    }
  } catch (proxyErr) {
    console.warn("Proxy add squad sync failed, trying direct fallback:", proxyErr);
  }

  // Direct fallback to Google Sheets Webhook
  if (!webhookUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return true;
  } catch (err) {
    console.warn("Could not sync add squad to Google Sheets directly:", err);
    return false;
  }
}

/**
 * Syncs check-in status to Google Sheets via caching proxy (with direct fallback)
 */
export async function syncCheckInToRemote(id: string, checkedIn: boolean): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        action: "updateCheckIn",
        id,
        checkedIn,
        sheetsUrl: webhookUrl,
        url: webhookUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (data && data.success !== false) {
        return true;
      }
    }
  } catch (proxyErr) {
    console.warn("Proxy check-in sync failed, trying direct fallback:", proxyErr);
  }

  // Direct fallback to Google Sheets Webhook
  if (!webhookUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateCheckIn",
        id,
        checkedIn,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return true;
  } catch (err) {
    console.warn("Could not sync check-in to Google Sheets directly:", err);
    return false;
  }
}

/**
 * Syncs team member names to Google Sheets via caching proxy (with direct fallback)
 */
export async function syncMemberNamesToRemote(id: string, memberNames: string[]): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        action: "updateMemberNames",
        id,
        memberNames: memberNames,
        sheetsUrl: webhookUrl,
        url: webhookUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (data && data.success !== false) {
        return true;
      }
    }
  } catch (proxyErr) {
    console.warn("Proxy member names sync failed, trying direct fallback:", proxyErr);
  }

  // Direct fallback to Google Sheets Webhook
  if (!webhookUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateMemberNames",
        id,
        memberNames: memberNames,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return true;
  } catch (err) {
    console.warn("Could not sync member names to Google Sheets directly:", err);
    return false;
  }
}

export async function syncDeleteToRemote(id: string): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        action: "delete",
        id,
        sheetsUrl: webhookUrl,
        url: webhookUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (data && data.success !== false) {
        return true;
      }
    }
  } catch (proxyErr) {
    console.warn("Proxy deletion sync failed, trying direct fallback:", proxyErr);
  }

  // Direct fallback to Google Sheets Webhook
  if (!webhookUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        id,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return true;
  } catch (err) {
    console.warn("Could not sync deletion to Google Sheets directly:", err);
    return false;
  }
}

/**
 * Syncs payment status to remote comms automation Web App via caching proxy (with direct fallback)
 */
export async function syncPaymentToRemote(
  id: string,
  email: string,
  paymentRef: string,
  leaderName: string,
  teamName: string,
  paid: boolean = true,
): Promise<boolean> {
  const paymentsUrl = getPaymentsWebhookUrl();
  const sheetsUrl = getGoogleSheetsWebhookUrl();
  const action = paid ? "markPaid" : "markUnpaid";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        action,
        id,
        email,
        paymentRef: paid ? paymentRef : "",
        leaderName,
        teamName,
        paid,
        paymentsUrl,
        sheetsUrl,
        url: paymentsUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (data && data.success !== false) {
        return true;
      }
    }
  } catch (proxyErr) {
    console.warn("Proxy payment sync failed, trying direct fallback:", proxyErr);
  }

  // Direct fallback to payments webhook URL
  if (!paymentsUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    await fetch(paymentsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        id,
        email,
        paymentRef: paid ? paymentRef : "",
        leaderName,
        teamName,
        paid,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return true;
  } catch (err) {
    console.warn("Could not sync payment to remote directly:", err);
    return false;
  }
}

/**
 * Maps threat sectors to Google Form acceptable choices
 */
function mapThreatSectorForForm(track: string): string {
  const t = track.toLowerCase();
  if (t.includes("tsunami") || t.includes("earthquake")) return "Tsunami & Earthquake Mitigation";
  if (t.includes("wildfire")) return "Wildfire Prevention";
  if (t.includes("oceanic") || t.includes("flood")) return "Flood & Cyclone Warning";
  if (t.includes("off-world") || t.includes("heat")) return "Heatwave Management";
  return "OPEN Innovation";
}

/**
 * Submits form data directly into the Dual-Sync Google Form (https://forms.gle/2EKyiYHmae8oWEtf7)
 */
export async function submitDirectlyToGoogleForm(
  formData: Omit<Registration, "id" | "timestamp">,
): Promise<boolean> {
  try {
    const body = new URLSearchParams();
    // 1. Squad Name
    body.append("entry.408752221", formData.teamName || "Unnamed Squad");
    // 2. Squad Leader Full Name
    body.append("entry.53592883", formData.leaderName || "Unknown");
    // 3. Contact Email Address
    body.append("entry.972077556", formData.email || "");
    // 4. Mobile Number
    body.append("entry.236924443", formData.phone || "");
    // 5. Institution / College Name
    body.append("entry.1527823126", formData.institution || "");
    // 6. Threat Sector
    body.append("entry.1266596728", mapThreatSectorForForm(formData.track));
    // 7. Squad Size (e.g. "1 Member" / "4 Members")
    const sizeStr = formData.teamSize === "1" ? "1 Member" : `${formData.teamSize} Members`;
    body.append("entry.84942108", sizeStr);
    // 8. Project Brief / Idea
    body.append("entry.567220697", formData.brief || "Direct Web Registration Submission");

    await fetch(DUAL_SYNC_GOOGLE_FORM_RESPONSE_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    return true;
  } catch (err) {
    console.warn("Dual-sync Google Form direct submission background error:", err);
    return false;
  }
}

/**
 * Pulls payment statuses live from the comms automation script via caching proxy (with direct fallback)
 */
export async function fetchPaymentStatuses(
  urlOverride?: string,
  options?: { forceFresh?: boolean },
): Promise<{ success: boolean; data: Record<string, { paid: boolean; paymentRef?: string }> }> {
  const url = (urlOverride || getPaymentsWebhookUrl()).trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let json: unknown = null;
    try {
      const proxyUrl = `/api/registrations?paymentsUrl=${encodeURIComponent(url)}&url=${encodeURIComponent(url)}${options?.forceFresh ? "&fresh=1" : ""}`;
      const proxyRes = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        signal: controller.signal,
      });
      const ct = proxyRes.headers.get("content-type") || "";
      if (proxyRes.ok && ct.includes("application/json")) {
        json = await proxyRes.json();
      }
      if (!json) {
        throw new Error("Proxy did not return valid payments JSON");
      }
    } catch (err) {
      console.error("Proxy fetch for payments failed:", err);
      // Direct fallback
      if (!url) return { success: false, data: {} };
      const directRes = await fetch(`${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (directRes.ok) {
        json = await directRes.json().catch(() => null);
      }
    }

    clearTimeout(timeout);

    if (json) {
      const result: Record<string, { paid: boolean; paymentRef?: string }> = {};

      let targetJson = json;
      if (json && typeof json === "object" && !Array.isArray(json) && Array.isArray((json as any).data)) {
        targetJson = (json as any).data;
      }
      
      if (Array.isArray(targetJson)) {
        for (const item of targetJson as Record<string, unknown>[]) {
          const id = String(
            item.id || item.ID || item["Pass ID"] || item["PassID"] || item.passId || "",
          ).trim();
          if (!id) continue;

          const isExplicitFalse =
            item.paid === false ||
            String(item.paid || "").toLowerCase() === "false" ||
            String(item.status || "").toLowerCase() === "unpaid" ||
            String(item.status || "").toLowerCase() === "not paid" ||
            String(item.paid || "").toUpperCase() === "NO" ||
            String(item["Paid"] || "").toUpperCase() === "NO";

          const paymentRef = String(
            item.paymentRef ||
              item.referenceId ||
              item["Payment Ref"] ||
              item["Payment Reference ID"] ||
              "",
          ).trim();

          const paid =
            !isExplicitFalse &&
            (item.paid === true ||
              String(item.paid || "").toLowerCase() === "true" ||
              String(item.status || "").toLowerCase() === "paid" ||
              String(item.paid || "").toUpperCase() === "YES" ||
              String(item["Paid"] || "").toUpperCase() === "YES" ||
              Boolean(paymentRef));

          result[id] = { paid, paymentRef: paymentRef || undefined };
        }
      } else if (targetJson && typeof targetJson === "object") {
        for (const [id, val] of Object.entries(targetJson as Record<string, unknown>)) {
          if (val && typeof val === "object") {
            const v = val as Record<string, unknown>;
            const isExplicitFalse =
              v.paid === false ||
              String(v.paid || "").toLowerCase() === "false" ||
              String(v.status || "").toLowerCase() === "unpaid" ||
              String(v.status || "").toLowerCase() === "not paid" ||
              String(v["Paid"] || "").toUpperCase() === "NO";

            const paymentRef = v.paymentRef ? String(v.paymentRef).trim() : undefined;

            const isPaid =
              !isExplicitFalse &&
              (Boolean(v.paid) ||
                String(v.paid || "").toLowerCase() === "true" ||
                String(v.status || "").toLowerCase() === "paid" ||
                String(v["Paid"] || "").toUpperCase() === "YES" ||
                Boolean(paymentRef));

            result[id] = {
              paid: isPaid,
              paymentRef,
            };
          }
        }
      }
      return { success: true, data: result };
    }
  } catch (err) {
    console.warn("Could not fetch payment statuses:", err);
  }
  return { success: false, data: {} };
}

/**
 * Pull registrations live from the Google Sheet via caching proxy (with direct fallback)
 * and merge payment statuses purely client-side by matching ID
 */
export async function fetchRemoteRegistrations(
  urlOverride?: string,
  options?: { forceFresh?: boolean },
): Promise<{ success: boolean; data: Registration[]; message?: string; paymentsStale?: boolean }> {
  const url = (urlOverride || getGoogleSheetsWebhookUrl()).trim();
  const paymentsUrl = getPaymentsWebhookUrl().trim();
  let paymentsStale = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    // Call caching proxy endpoint first
    let json: unknown = null;
    let isFromProxy = false;
    try {
      const proxyUrl = `/api/registrations?sheetsUrl=${encodeURIComponent(url)}&paymentsUrl=${encodeURIComponent(paymentsUrl)}&url=${encodeURIComponent(url)}${options?.forceFresh ? "&fresh=1" : ""}`;
      const proxyRes = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        signal: controller.signal,
      });
      if (proxyRes.status === 401) {
        clearTimeout(timeout);
        return { success: false, data: [], message: "Unauthorized" };
      }
      const ct = proxyRes.headers.get("content-type") || "";
      if (proxyRes.ok && ct.includes("application/json")) {
        const parsedData = await proxyRes.json();
        if (Array.isArray(parsedData)) {
          json = parsedData;
          isFromProxy = true;
        } else if (parsedData && Array.isArray(parsedData.data)) {
          json = parsedData.data;
          isFromProxy = true;
          paymentsStale = Boolean(parsedData.paymentsStale);
        } else if (parsedData && parsedData.error) {
          throw new Error(parsedData.error);
        }
      }
      if (!json) {
        throw new Error(`Proxy status ${proxyRes.status}: invalid response`);
      }
    } catch (proxyErr) {
      clearTimeout(timeout);
      console.warn(
        "Proxy registrations fetch failed, falling back to direct Google Sheets:",
        proxyErr,
      );
      // Direct fallback to Google Sheets
      if (!url) {
        return { success: false, data: [], message: "No Google Sheets webhook URL configured." };
      }
      const directController = new AbortController();
      const directTimer = setTimeout(() => directController.abort(), 20000);
      try {
        const directRes = await fetch(`${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          redirect: "follow",
          signal: directController.signal,
        });
        clearTimeout(directTimer);
        if (directRes.ok) {
          const directData = await directRes.json().catch(() => null);
          if (Array.isArray(directData)) {
            json = directData;
          } else if (directData && Array.isArray(directData.data)) {
            json = directData.data;
          }
        }
      } catch (directErr) {
        clearTimeout(directTimer);
        console.warn("Direct Google Sheets fallback failed:", directErr);
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!Array.isArray(json)) {
      throw new Error("Remote response was not a valid array");
    }
    if (Array.isArray(json)) {
      const parsed: Registration[] = (json as Record<string, unknown>[]).map((item) => ({
        id: String(
          item.id ||
            item.ID ||
            item["Pass ID"] ||
            `ZH-${Math.floor(100000 + Math.random() * 900000)}`,
        ),
        teamName: String(item.teamName || item["Team Name"] || "Unnamed Squad"),
        leaderName: String(item.leaderName || item["Leader Name"] || "Unknown"),
        email: String(item.email || item.Email || ""),
        phone: String(item.phone || item.Phone || item["Mobile Number"] || ""),
        institution: String(
          item.institution || item.Institution || item["Institution / College"] || "",
        ),
        track: String(item.track || item.Track || item["Threat Sector"] || "General"),
        teamSize: String(item.teamSize || item["Team Size"] || item["Squad Size"] || "4"),
        memberNames: (() => {
          const raw =
            item.memberNames ||
            item["Member Names"] ||
            item["Team Members"] ||
            item["Members"] ||
            item.TeamMembers;

          if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
          if (typeof raw === "string" && raw.trim() !== "") {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                return parsed.map(String).map((s) => s.trim()).filter(Boolean);
              }
            } catch {}
            return raw
              .split(/[\n,]+/)
              .map((n) => n.replace(/^\d+\.\s*/, "").trim())
              .filter(Boolean);
          }
          return [];
        })(),
        brief: String(item.brief || item.Brief || item["Mission Brief"] || ""),
        timestamp: String(
          item.timestamp || item.Timestamp || item["Registered At"] || new Date().toISOString(),
        ),
        checkedIn: Boolean(
          item.checkedIn ||
          item.CheckedIn ||
          String(item["Checked In"] || "").toUpperCase() === "YES",
        ),
        status: (item.status as Registration["status"]) || "confirmed",
        paid: Boolean(item.paid || item.Paid || String(item["Paid"] || "").toUpperCase() === "YES"),
        paymentRef: item.paymentRef
          ? String(item.paymentRef)
          : item["Payment Ref"]
            ? String(item["Payment Ref"])
            : undefined,
        source: "remote",
        syncedToRemote: true,
      }));

      // Pull payment statuses if direct fallback was used OR if proxy reported paymentsStale
      let paymentMap: Record<string, { paid?: boolean; paymentRef?: string }> = {};
      if (!isFromProxy || paymentsStale) {
        const payments = await fetchPaymentStatuses(
          undefined,
          options?.forceFresh ? { forceFresh: true } : {},
        ).catch(() => ({ success: false, data: {} }));
        paymentMap = payments.data || {};
        if (Object.keys(paymentMap).length > 0) {
          paymentsStale = false;
        }
      }

      // Merge with local records
      const local = getStoredRegistrations();
      const map = new Map<string, Registration>();

      // 1. Put remote first and enrich with payments if fetched (safely merge duplicates)
      parsed.forEach((r) => {
        const payInfo = paymentMap[r.id];
        if (payInfo) {
          if (payInfo.paid) r.paid = true;
          if (payInfo.paymentRef !== undefined) r.paymentRef = payInfo.paymentRef;
        }
        r.source = "remote";
        r.syncedToRemote = true;

        const existing = map.get(r.id);
        if (existing) {
          // If existing has non-blank fields and new one is blank or placeholder, keep existing values
          const merged: Registration = { ...existing };
          if (r.teamName && r.teamName.trim() && r.teamName !== "Unnamed Squad") merged.teamName = r.teamName;
          if (r.leaderName && r.leaderName.trim() && r.leaderName !== "Unknown") merged.leaderName = r.leaderName;
          if (r.email && r.email.trim()) merged.email = r.email;
          if (r.phone && r.phone.trim()) merged.phone = r.phone;
          if (r.institution && r.institution.trim()) merged.institution = r.institution;
          if (r.track && r.track.trim()) merged.track = r.track;
          if (r.brief && r.brief.trim()) merged.brief = r.brief;
          if (r.memberNames && r.memberNames.length > 0) merged.memberNames = r.memberNames;
          if (r.paid !== undefined) merged.paid = r.paid;
          if (r.paymentRef) merged.paymentRef = r.paymentRef;
          if (r.checkedIn !== undefined) merged.checkedIn = r.checkedIn;
          map.set(r.id, merged);
        } else {
          map.set(r.id, r);
        }
      });

      // 2. Safety check: Protect against upstream quota failures, partial responses, or timeouts.
      // If we already have entries locally (>= 4) and remote returns < 50% of them,
      // treat this as a partial/glitched fetch and do NOT remove missing entries.
      const isSuspiciouslySmall =
        local.length >= 4 && parsed.length < Math.ceil(local.length * 0.5);

      // 3. Reconcile with local records:
      // If forceFresh is requested, remote Google Sheet / Payments data is authoritative for statuses,
      // but protect against blank/unnamed overwrites and keep recent local additions.
      local.forEach((r) => {
        const existing = map.get(r.id);
        if (existing) {
          // Guard against remote having "Unnamed Squad" or empty if local already has a valid name
          if (
            (!existing.teamName || existing.teamName === "Unnamed Squad") &&
            r.teamName &&
            r.teamName !== "Unnamed Squad"
          ) {
            existing.teamName = r.teamName;
          }
          if (
            (!existing.leaderName || existing.leaderName === "Unknown") &&
            r.leaderName &&
            r.leaderName !== "Unknown"
          ) {
            existing.leaderName = r.leaderName;
          }

          // Protect known payments: If squad was paid locally, DO NOT revert to unpaid unless forceFresh is requested AND payments are not stale
          if (r.paid && !existing.paid && (!options?.forceFresh || paymentsStale)) {
            existing.paid = true;
            if (r.paymentRef && !existing.paymentRef) {
              existing.paymentRef = r.paymentRef;
            }
          }

          // Protect recent optimistic local edits (<60s) while Google Sheets background write catches up
          const isRecentLocalEdit =
            !options?.forceFresh &&
            Boolean(r.lastLocalEdit && Date.now() - r.lastLocalEdit < 60000);

          if (isRecentLocalEdit) {
            if (typeof r.checkedIn === "boolean") existing.checkedIn = r.checkedIn;
            if (typeof r.paid === "boolean") existing.paid = r.paid;
            if (r.paymentRef !== undefined) existing.paymentRef = r.paymentRef;
            if (Array.isArray(r.memberNames) && r.memberNames.length > 0) existing.memberNames = r.memberNames;
            existing.lastLocalEdit = r.lastLocalEdit;
          }
          existing.source = "remote";
          existing.syncedToRemote = true;
        } else {
          // Absent from remote response:
          // A. If the remote result is empty or suspiciously small, protect local data from accidental wipe
          if (parsed.length === 0 || isSuspiciouslySmall) {
            const payInfo = paymentMap[r.id];
            if (payInfo) {
              r.paid = payInfo.paid;
              if (payInfo.paymentRef) r.paymentRef = payInfo.paymentRef;
            }
            map.set(r.id, r);
            return;
          }

          // B. If this is a locally-created submission that hasn't synced to Google Sheets yet
          // or was created/edited recently (within 5 minutes), retain it so it is never prematurely pruned!
          const timeSinceCreated = r.timestamp ? Date.now() - new Date(r.timestamp).getTime() : Infinity;
          const timeSinceEdit = r.lastLocalEdit ? Date.now() - r.lastLocalEdit : Infinity;
          const isPendingLocal =
            r.source === "local" ||
            !r.syncedToRemote ||
            timeSinceCreated < 5 * 60 * 1000 ||
            timeSinceEdit < 5 * 60 * 1000;

          if (isPendingLocal) {
            const payInfo = paymentMap[r.id];
            if (payInfo) {
              r.paid = payInfo.paid;
              if (payInfo.paymentRef) r.paymentRef = payInfo.paymentRef;
            }
            map.set(r.id, r);
            return;
          }

          // C. Reconcile: Entry was sourced from remote (or previously synced) and has been absent for >5 minutes.
          // By omitting map.set(r.id, r), it is treated as genuinely deleted from Google Sheets.
        }
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      saveAllRegistrations(merged);
      return { success: true, data: merged, paymentsStale };
    }

    return {
      success: false,
      data: getStoredRegistrations(),
      message: "Remote replied, but no array found.",
    };
  } catch (err) {
    console.warn("Could not fetch remote registrations directly:", err);
    return {
      success: false,
      data: getStoredRegistrations(),
      message: err instanceof Error ? err.message : "Fetch timed out or failed",
    };
  }
}

export async function submitRegistrationData(
  formData: Omit<Registration, "id" | "timestamp">,
): Promise<SubmissionResult> {
  const uniqueNum = Math.floor(100000 + Math.random() * 900000);
  const id = `ZH-${uniqueNum}`;
  const timestamp = new Date().toISOString();

  const newReg = {
    ...formData,
    id,
    timestamp,
    status: "confirmed" as const,
    checkedIn: false,
    source: "local" as const,
    syncedToRemote: false,
    action: "register"
  };

  // 1. Save locally for instant Excel export & instant admin console updates
  saveRegistrationLocally(newReg);

  // 2. Dispatch event for open admin tabs
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("zeroth_registration_updated"));
  }

  // 3. Dual-Sync: Submit simultaneously to Google Sheet Webhook AND Dual-Sync Google Form
  const promises: Promise<unknown>[] = [];

  // A. Submit to Dual-Sync Google Form (https://forms.gle/2EKyiYHmae8oWEtf7)
  promises.push(submitDirectlyToGoogleForm(formData));

  // B. Submit to Google Sheets Webhook via our secure Proxy
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  const sheetPromise = fetch("/api/registrations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newReg),
    signal: controller.signal,
  })
    .then(() => clearTimeout(timer))
    .catch((err) => {
      console.warn("Google Sheets cloud sync error:", err);
    });

  promises.push(sheetPromise);

  try {
    await Promise.allSettled(promises);
  } catch {
    // Local save already succeeded
  }

  return {
    id,
    cloudSuccess: true,
    fallbackUrl: BACKUP_GOOGLE_FORM_URL,
  };
}

export function exportRegistrationsToCsv(registrations: Registration[]): void {
  if (!registrations.length) {
    throw new Error("No registrations found to export.");
  }

  const headers = [
    "Pass ID",
    "Team Name",
    "Leader Name",
    "Email",
    "Mobile Number",
    "Institution",
    "Threat Sector",
    "Squad Size",
    "Member Names",
    "Mission Brief",
    "Registered At",
    "Checked In",
    "Payment Status",
    "Payment Reference ID",
  ];

  const rows = registrations.map((r) => [
    r.id,
    `"${(r.teamName || "").replace(/"/g, '""')}"`,
    `"${(r.leaderName || "").replace(/"/g, '""')}"`,
    `"${(r.email || "").replace(/"/g, '""')}"`,
    `"${(r.phone || "").replace(/"/g, '""')}"`,
    `"${(r.institution || "").replace(/"/g, '""')}"`,
    `"${(r.track || "").replace(/"/g, '""')}"`,
    r.teamSize,
    `"${(r.memberNames || []).join("; ").replace(/"/g, '""')}"`,
    `"${(r.brief || "").replace(/"/g, '""')}"`,
    r.timestamp
      ? new Date(r.timestamp).toLocaleString("en-GB")
      : new Date().toLocaleString("en-GB"),
    r.checkedIn ? "YES" : "NO",
    r.paid ? "PAID" : "UNPAID",
    `"${(r.paymentRef || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `zeroth_hour_roster_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
