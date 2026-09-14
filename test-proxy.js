import { handlePaymentsProxy } from "./src/server/proxy-handlers.js";

async function run() {
  const req = new Request("http://localhost:3000/api/payments?url=", {
    method: "GET",
    headers: {
      "Authorization": "Bearer makeathon-secure-12345"
    }
  });

  try {
    const res = await handlePaymentsProxy(req);
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
