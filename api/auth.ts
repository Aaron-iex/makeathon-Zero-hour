export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const { pin } = body;
      const correctPin = process.env.ADMIN_PIN || "Zero@123";
      const token = process.env.ADMIN_SECRET_TOKEN || "zeroth-secure-token-xyz-987";
      
      if (pin === correctPin) {
        return new Response(JSON.stringify({ success: true, token }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Invalid Passcode" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: "Bad Request" }), { status: 400 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
