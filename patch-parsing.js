const fs = require('fs');
let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// Replace the parsing block in fetchPaymentStatuses
const oldBlock = `      if (Array.isArray(json)) {
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
      }`;

const newBlock = `      let targetJson = json;
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
      }`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/lib/registrations.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find old block");
}
