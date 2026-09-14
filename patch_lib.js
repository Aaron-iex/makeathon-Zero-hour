import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// 1. Add memberNames to Registration interface
code = code.replace(
  '  teamSize: string;',
  '  teamSize: string;\n  memberNames?: string[];'
);

// 2. Add memberNames parsing in fetchRemoteRegistrations
const parseTarget = `        teamSize: String(item.teamSize || item["Team Size"] || item["Squad Size"] || "4"),`;
const parseReplacement = `        teamSize: String(item.teamSize || item["Team Size"] || item["Squad Size"] || "4"),
        memberNames: (() => {
          const raw = item.memberNames || item["Member Names"];
          if (Array.isArray(raw)) return raw.map(String);
          if (typeof raw === "string" && raw.trim() !== "") {
            return raw.split("\\n").map((n) => n.replace(/^\\d+\\.\\s*/, "").trim()).filter(Boolean);
          }
          return [];
        })(),`;
if (!code.includes('memberNames: (() => {')) {
  code = code.replace(parseTarget, parseReplacement);
}

// 3. Add syncMemberNamesToRemote function
const syncTarget = `export async function syncDeleteToRemote(id: string): Promise<boolean> {`;
const syncReplacement = `/**
 * Syncs team member names to Google Sheets via caching proxy (with direct fallback)
 */
export async function syncMemberNamesToRemote(id: string, memberNames: string[]): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${getAuthToken()}\`,
      },
      body: JSON.stringify({
        action: "updateMemberNames",
        id,
        memberNames: JSON.stringify(memberNames),
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
    const timer = setTimeout(() => controller.abort(), 6000);

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateMemberNames",
        id,
        memberNames: JSON.stringify(memberNames),
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

export async function syncDeleteToRemote(id: string): Promise<boolean> {`;
if (!code.includes('export async function syncMemberNamesToRemote')) {
  code = code.replace(syncTarget, syncReplacement);
}

// 4. Update exportRegistrationsToCsv
const exportTarget = `    "Squad Size",`;
const exportReplacement = `    "Squad Size",\n    "Member Names",`;
if (code.includes(exportTarget) && !code.includes('"Member Names",')) {
  code = code.replace(exportTarget, exportReplacement);
}

const exportTarget2 = `      r.teamSize,`;
const exportReplacement2 = `      r.teamSize,\n      (r.memberNames || []).join("; "),`;
if (code.includes(exportTarget2) && !code.includes('(r.memberNames || []).join("; "),')) {
  code = code.replace(exportTarget2, exportReplacement2);
}

fs.writeFileSync('src/lib/registrations.ts', code);
console.log("src/lib/registrations.ts updated");
