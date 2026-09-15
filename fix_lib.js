import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// 1. Remove fetchPaymentStatuses
const paymentRegex = /\/\*\*\n \* Pulls payment statuses[\s\S]*?export async function fetchRegistrations/g;
code = code.replace(paymentRegex, 'export async function fetchRegistrations');

// 2. Rewrite fetchRegistrations
const fetchRegRegex = /export async function fetchRegistrations\([\s\S]*?\n\}/;
const newFetchReg = `export async function fetchRegistrations(
  options?: { forceFresh?: boolean },
): Promise<{ success: boolean; data: Registration[]; message?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const proxyUrl = \`/api/registrations\${options?.forceFresh ? "?fresh=1" : ""}\`;
    const proxyRes = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: \`Bearer \${getAuthToken()}\`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    const ct = proxyRes.headers.get("content-type") || "";
    if (!proxyRes.ok || !ct.includes("application/json")) {
      throw new Error("Proxy did not return valid JSON");
    }
    
    const json = await proxyRes.json();
    if (!Array.isArray(json)) {
      throw new Error("Proxy response was not a valid array");
    }
    
    return { success: true, data: json as Registration[] };
  } catch (err) {
    console.error("Error fetching remote registrations:", err);
    return { success: false, data: [], message: String(err) };
  }
}`;
code = code.replace(fetchRegRegex, newFetchReg);

fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Fixed lib registrations");
