// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { handleRegistrationsProxy } from "./src/server/proxy-handlers.ts";

function apiDevProxyPlugin(): Plugin {
  return {
    name: "api-dev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        if (
          url.pathname === "/api/registrations" ||
          url.pathname === "/api/registrations/" 
        ) {
          try {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
              if (v) {
                if (Array.isArray(v)) {
                  v.forEach((val) => headers.append(k, val));
                } else {
                  headers.set(k, v);
                }
              }
            }

            const webRequest = new Request(url.href, {
              method: req.method,
              headers,
              body:
                req.method !== "GET" && req.method !== "HEAD"
                  ? (body as unknown as BodyInit) || null
                  : null,
            });

            const webResponse = await handleRegistrationsProxy(webRequest);

            res.statusCode = webResponse.status;
            webResponse.headers.forEach((val: string, key: string) => {
              res.setHeader(key, val);
            });
            const arrayBuffer = await webResponse.arrayBuffer();
            res.end(Buffer.from(arrayBuffer));
          } catch (err) {
            console.error("API dev proxy error:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [apiDevProxyPlugin()],
    server: {
      watch: {
        ignored: ["**/.output/**", "**/.nitro/**", "**/.wrangler/**"],
      },
    },
  },
});
