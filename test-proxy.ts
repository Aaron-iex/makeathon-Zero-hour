import { handlePaymentsProxy } from "./src/server/proxy-handlers";

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
    console.log("Headers:", Array.from(res.headers.entries()));
    const body = await res.text();
    console.log("Body starts with:", body.slice(0, 100));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
