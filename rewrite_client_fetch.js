import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// Replace fetchRegistrations entirely
const fetchRegRegex = /\/\*\*\n \* Main synchronizer.*?\nexport async function fetchRegistrations[\s\S]*?return \{ success: true, data: merged \};\n  \} catch \(err\) \{\n    console\.error\("Error fetching remote registrations:", err\);\n    return \{ success: false, data: \[\], message: String\(err\) \};\n  \}\n\}/;
const newFetchReg = `/**
 * Main synchronizer: Pulls live Registration logs from Proxy
 */
export async function fetchRegistrations(
  options?: { forceFresh?: boolean },
): Promise<{ success: boolean; data: Registration[]; message?: string }> {
  const url = getGoogleSheetsWebhookUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let json: unknown = null;
    try {
      const proxyUrl = \`/api/registrations?url=\${encodeURIComponent(url)}\${options?.forceFresh ? "&fresh=1" : ""}\`;
      const proxyRes = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: \`Bearer \${getAuthToken()}\`,
        },
        signal: controller.signal,
      });
      const ct = proxyRes.headers.get("content-type") || "";
      if (proxyRes.ok && ct.includes("application/json")) {
        const parsedData = await proxyRes.json();
        if (Array.isArray(parsedData)) {
          json = parsedData;
        }
      }
      if (!json) {
        throw new Error("Proxy did not return valid registration array");
      }
    } catch (proxyErr) {
      console.warn("Proxy registrations fetch failed:", proxyErr);
      return { success: false, data: [], message: String(proxyErr) };
    }

    clearTimeout(timeout);

    if (!Array.isArray(json)) {
      throw new Error("Remote response was not a valid array");
    }
    
    // The proxy has already mapped it perfectly to Registration[]
    const merged: Registration[] = json as Registration[];

    return { success: true, data: merged };
  } catch (err) {
    console.error("Error fetching remote registrations:", err);
    return { success: false, data: [], message: String(err) };
  }
}`;

code = code.replace(fetchRegRegex, newFetchReg);
fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Rewrote fetchRegistrations in lib");
