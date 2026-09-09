import { handleRegistrationsProxy } from "../../src/server/proxy-handlers";

export async function onRequest(context: { request: Request; env: unknown }): Promise<Response> {
  return handleRegistrationsProxy(context.request, context.env, context);
}
