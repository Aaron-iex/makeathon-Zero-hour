const json = {
  "success": true,
  "data": [
    { "id": "ZH-123", "paid": true, "paymentRef": "UPI123" }
  ]
};

const result = {};
if (Array.isArray(json)) {
  console.log("It's an array");
} else if (json && typeof json === "object") {
  for (const [id, val] of Object.entries(json)) {
    if (val && typeof val === "object") {
      const v = val;
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
          String(v.paid || "").toUpperCase() === "YES" ||
          String(v["Paid"] || "").toUpperCase() === "YES" ||
          Boolean(paymentRef));

      result[id] = { paid: Boolean(isPaid), paymentRef };
    }
  }
}
console.log(result);
