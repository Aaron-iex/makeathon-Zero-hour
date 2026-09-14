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
  source?: string;
  remarks?: string;
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

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("zeroth_admin_token") || "";
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
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SHEETS_URL_KEY) || "";
}

export function setGoogleSheetsWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHEETS_URL_KEY, url.trim());
}

export function getPaymentsWebhookUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PAYMENTS_URL_KEY) || "";
}

export function setPaymentsWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAYMENTS_URL_KEY, url.trim());
}

/**
 * Syncs check-in status to Google Sheets via caching proxy (with direct fallback)
 */
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
  const promises: Promise<unknown>[] = [];

  // A. Submit to Dual-Sync Google Form (https://forms.gle/2EKyiYHmae8oWEtf7)
  promises.push(submitDirectlyToGoogleForm(formData));

  // B. Submit to Google Sheets Webhook via our secure Proxy
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

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
    "Remarks",
    "Source",
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
    `"${(r.remarks || "").replace(/"/g, '""')}"`,
    `"${(r.source || "").replace(/"/g, '""')}"`,
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
