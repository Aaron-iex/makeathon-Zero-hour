export interface Registration {
  id: string;
  teamName: string;
  leaderName: string;
  email: string;
  phone: string;
  institution: string;
  track: string;
  teamSize: string;
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

// 3. Google Apps Script Webhook URL (Direct Google Sheets Row Ingestion)
export const DEFAULT_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbycYaGTT0ppofK5v8Fg15OCN7_gkKiMo9vMKKc9vtXezbenKvO2RCwA2v_shoTup8e2/exec";

// 4. Comms Automation Script Web App Deployment URL (Payment statuses & notifications)
export const DEFAULT_PAYMENTS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxksTqZOBYTFQ1KtnYd1B-ZTsWrvJdVwIiYDGcElwZjQB4AQQ-lg_5fiXl_5h-CYBg_/exec";

export function getStoredRegistrations(): Registration[] {
  if (typeof window === "undefined") return [];
  try {
    // Migration & cleanup: Remove legacy persistent cache from localStorage
    if (localStorage.getItem(STORAGE_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
    }
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading registrations:", e);
    return [];
  }
}

export function saveAllRegistrations(list: Registration[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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

export function getGoogleSheetsWebhookUrl(): string {
  if (typeof window === "undefined") return DEFAULT_SHEETS_WEBHOOK_URL;
  return localStorage.getItem(SHEETS_URL_KEY) || DEFAULT_SHEETS_WEBHOOK_URL;
}

export function setGoogleSheetsWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHEETS_URL_KEY, url.trim());
}

export function getPaymentsWebhookUrl(): string {
  if (typeof window === "undefined") return DEFAULT_PAYMENTS_WEBHOOK_URL;
  return localStorage.getItem(PAYMENTS_URL_KEY) || DEFAULT_PAYMENTS_WEBHOOK_URL;
}

export function setPaymentsWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAYMENTS_URL_KEY, url.trim());
}

/**
 * Syncs check-in status to Google Sheets via caching proxy (with direct fallback)
 */
export async function syncCheckInToRemote(id: string, checkedIn: boolean): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateCheckIn",
        id,
        checkedIn,
        url: webhookUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (res.ok) {
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
    const timer = setTimeout(() => controller.abort(), 6000);

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
 * Syncs deletion to Google Sheets via caching proxy (with direct fallback)
 */
export async function syncDeleteToRemote(id: string): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        id,
        url: webhookUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (res.ok) {
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
    const timer = setTimeout(() => controller.abort(), 6000);

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
  const action = paid ? "markPaid" : "markUnpaid";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        id,
        email,
        paymentRef: paid ? paymentRef : "",
        leaderName,
        teamName,
        paid,
        url: paymentsUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (res.ok) {
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
    const timer = setTimeout(() => controller.abort(), 6000);

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
  if (!url) return { success: false, data: {} };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let res: Response | null = null;
    try {
      const proxyUrl = `/api/payments?url=${encodeURIComponent(url)}${options?.forceFresh ? "&fresh=1" : ""}`;
      res = await fetch(proxyUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch {
      // Direct fallback
      res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    }

    clearTimeout(timeout);

    if (res && res.ok) {
      const json = (await res.json()) as unknown;
      const result: Record<string, { paid: boolean; paymentRef?: string }> = {};

      if (Array.isArray(json)) {
        for (const item of json as Record<string, unknown>[]) {
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
      } else if (json && typeof json === "object") {
        for (const [id, val] of Object.entries(json as Record<string, unknown>)) {
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
): Promise<{ success: boolean; data: Registration[]; message?: string }> {
  const url = (urlOverride || getGoogleSheetsWebhookUrl()).trim();
  if (!url) {
    return { success: false, data: [], message: "No Google Sheets webhook URL configured." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    // Call caching proxy endpoint first
    let res: Response | null = null;
    try {
      const proxyUrl = `/api/registrations?url=${encodeURIComponent(url)}${options?.forceFresh ? "&fresh=1" : ""}`;
      res = await fetch(proxyUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Proxy status ${res.status}`);
      }
    } catch (proxyErr) {
      console.warn("Proxy registrations fetch failed, trying direct fallback:", proxyErr);
      // Direct fallback to Google Sheets
      res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
    }

    clearTimeout(timeout);

    if (!res || !res.ok) {
      throw new Error(`HTTP error ${res?.status || "unknown"}: ${res?.statusText || ""}`);
    }

    const json = (await res.json()) as unknown;
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

      // Pull payment statuses in background / parallel and merge client-side
      const payments = await fetchPaymentStatuses(undefined, {
        forceFresh: options?.forceFresh,
      }).catch(() => ({ success: false, data: {} }));
      const paymentMap = payments.data || {};

      // Merge with local records
      const local = getStoredRegistrations();
      const map = new Map<string, Registration>();

      // 1. Put remote first and enrich with payments
      parsed.forEach((r) => {
        const payInfo = paymentMap[r.id];
        if (payInfo) {
          r.paid = payInfo.paid;
          if (payInfo.paymentRef !== undefined) r.paymentRef = payInfo.paymentRef;
        }
        r.source = "remote";
        r.syncedToRemote = true;
        map.set(r.id, r);
      });

      // 2. Safety check: Protect against upstream quota failures, partial responses, or timeouts.
      // If we already have entries locally (>= 4) and remote returns < 50% of them,
      // treat this as a partial/glitched fetch and do NOT remove missing entries.
      const isSuspiciouslySmall =
        local.length >= 4 && parsed.length < Math.ceil(local.length * 0.5);

      // 3. Reconcile with local records:
      // If forceFresh is requested, remote Google Sheet / Payments data is 100% authoritative.
      // If !forceFresh, only preserve very recent optimistic local edits (<15s) while background write completes.
      local.forEach((r) => {
        const existing = map.get(r.id);
        if (existing) {
          const isRecentLocalEdit =
            !options?.forceFresh &&
            Boolean(r.lastLocalEdit && Date.now() - r.lastLocalEdit < 15000);

          if (isRecentLocalEdit) {
            if (typeof r.checkedIn === "boolean") existing.checkedIn = r.checkedIn;
            if (typeof r.paid === "boolean") existing.paid = r.paid;
            if (r.paymentRef !== undefined) existing.paymentRef = r.paymentRef;
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

          // B. If this is a locally-created pending submission that hasn't synced to Google Sheets yet
          // (created within the last 15 minutes or explicitly marked source: "local"), retain it.
          const isPendingLocal =
            r.source === "local" ||
            (!r.syncedToRemote &&
              r.timestamp &&
              Date.now() - new Date(r.timestamp).getTime() < 15 * 60 * 1000);

          if (isPendingLocal) {
            const payInfo = paymentMap[r.id];
            if (payInfo) {
              r.paid = payInfo.paid;
              if (payInfo.paymentRef) r.paymentRef = payInfo.paymentRef;
            }
            map.set(r.id, r);
            return;
          }

          // C. Reconcile: Entry was sourced from remote (or previously synced) and is now deleted
          // in the Google Sheet. By omitting map.set(r.id, r), it is removed from local storage.
        }
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      saveAllRegistrations(merged);
      return { success: true, data: merged };
    }

    return {
      success: true,
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

  const newReg: Registration = {
    ...formData,
    id,
    timestamp,
    status: "confirmed",
    checkedIn: false,
    source: "local",
    syncedToRemote: false,
  };

  // 1. Save locally for instant Excel export & instant admin console updates
  saveRegistrationLocally(newReg);

  // 2. Dispatch event for open admin tabs
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("zeroth_registration_updated"));
  }

  // 3. Dual-Sync: Submit simultaneously to Google Sheet Webhook AND Dual-Sync Google Form
  const sheetsUrl = getGoogleSheetsWebhookUrl();
  const promises: Promise<unknown>[] = [];

  // A. Submit to Dual-Sync Google Form (https://forms.gle/2EKyiYHmae8oWEtf7)
  promises.push(submitDirectlyToGoogleForm(formData));

  // B. Submit to Google Sheets Webhook
  if (sheetsUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const sheetPromise = fetch(sheetsUrl, {
      method: "POST",
      mode: "no-cors",
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
  }

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
