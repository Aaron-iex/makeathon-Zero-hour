import fs from 'fs';
let code = fs.readFileSync('src/server/proxy-handlers.ts', 'utf8');

const regex = /if \(request\.method === "GET"\) \{[\s\S]*?\/\/ ── POST/m;
const replacement = `if (request.method === "GET") {
    if (!isAuthenticated) return jsonResponse({ error: "Unauthorized" }, 401, {}, request);

    // FALLBACK: Temporarily bypass Supabase and read directly from Sheets
    const targetUrl = url.searchParams.get("url")?.trim() || SHEETS_WEBHOOK_URL;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      
      const upstreamRes = await fetch(
        \`\${targetUrl}\${targetUrl.includes("?") ? "&" : "?"}_t=\${Date.now()}\`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          redirect: "follow",
        }
      );
      
      let paymentsData: any[] = [];
      if (PAYMENTS_WEBHOOK_URL) {
         try {
            const pRes = await fetch(
              \`\${PAYMENTS_WEBHOOK_URL}\${PAYMENTS_WEBHOOK_URL.includes("?") ? "&" : "?"}_t=\${Date.now()}\`,
              { method: "GET", headers: { Accept: "application/json" } }
            );
            if (pRes.ok) {
               const pJson: any = await pRes.json();
               paymentsData = Array.isArray(pJson) ? pJson : (Array.isArray(pJson.data) ? pJson.data : []);
            }
         } catch(e) {}
      }
      clearTimeout(timeout);

      if (!upstreamRes.ok) {
        throw new Error(\`Upstream returned HTTP \${upstreamRes.status}\`);
      }
      
      const rawText = await upstreamRes.text();
      let json: any = JSON.parse(rawText);
      
      if (Array.isArray(json)) {
        // Map Payments
        const paymentMap = new Map();
        for (const item of paymentsData) {
          const id = String(item.id || item.ID || item["Pass ID"] || item["PassID"] || item.passId || "").trim();
          if (!id) continue;
          const isExplicitFalse =
            item.paid === false ||
            String(item.paid || "").toLowerCase() === "false" ||
            String(item.status || "").toLowerCase() === "unpaid" ||
            String(item.status || "").toLowerCase() === "not paid" ||
            String(item.paid || "").toUpperCase() === "NO" ||
            String(item["Paid"] || "").toUpperCase() === "NO";

          const paymentRef = String(
            item.paymentRef || item.referenceId || item["Payment Ref"] || item["Payment Reference ID"] || "",
          ).trim();

          const paid = !isExplicitFalse && (item.paid === true || String(item.paid || "").toLowerCase() === "true" || String(item["Paid"] || "").toUpperCase() === "YES" || Boolean(paymentRef));
          
          paymentMap.set(id, { paid, paymentRef });
        }
        
        // Map Registrations
        const mapped = json.map(item => {
           const id = String(item.id || item.ID || item["Pass ID"] || \`ZH-\${Math.floor(100000 + Math.random() * 900000)}\`);
           const payInfo = paymentMap.get(id) || {};
           
           return {
             id,
             teamName: String(item.teamName || item["Team Name"] || "Unnamed Squad"),
             leaderName: String(item.leaderName || item["Leader Name"] || "Unknown"),
             email: String(item.email || item.Email || ""),
             phone: String(item.phone || item.Phone || item["Mobile Number"] || ""),
             institution: String(item.institution || item.Institution || item["Institution / College"] || ""),
             track: String(item.track || item.Track || item["Threat Sector"] || "General"),
             teamSize: String(item.teamSize || item["Team Size"] || item["Squad Size"] || "4"),
             memberNames: (() => {
                const raw = item.memberNames || item["Member Names"];
                if (Array.isArray(raw)) return raw.map(String);
                if (typeof raw === "string" && raw.trim() !== "") {
                  return raw.split("\\n").map((n: string) => n.replace(/^\\d+\\.\\s*/, "").trim()).filter(Boolean);
                }
                return [];
             })(),
             brief: String(item.brief || item.Brief || item["Mission Brief"] || ""),
             timestamp: String(item.timestamp || item.Timestamp || item["Registered At"] || new Date().toISOString()),
             checkedIn: Boolean(item.checkedIn || item.CheckedIn || String(item["Checked In"] || "").toUpperCase() === "YES"),
             status: item.status || "confirmed",
             paid: payInfo.paid !== undefined ? payInfo.paid : Boolean(item.paid || item.Paid || String(item["Paid"] || "").toUpperCase() === "YES"),
             paymentRef: payInfo.paymentRef !== undefined ? payInfo.paymentRef : (item.paymentRef ? String(item.paymentRef) : item["Payment Ref"] ? String(item["Payment Ref"]) : undefined),
             source: "remote",
             syncedToRemote: true,
           };
        });
        
        return jsonResponse(mapped, 200, {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }, request);
      }
      
      return jsonResponse({ error: "Invalid array from Sheets" }, 502, {}, request);
    } catch (err) {
      console.warn("Proxy GET error:", err);
      return jsonResponse({ error: "Upstream fetch failed" }, 502, {}, request);
    }
  }

  // ── POST`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/server/proxy-handlers.ts', code);
  console.log("Fixed!");
} else {
  console.log("Regex failed again.");
}
