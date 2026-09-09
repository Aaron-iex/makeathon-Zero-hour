import { handlePaymentsProxy } from "../src/server/proxy-handlers";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  return handlePaymentsProxy(request);
}
