import fs from 'fs';

let serverCode = fs.readFileSync('src/server.ts', 'utf8');
serverCode = serverCode.replace(
  /if \(url\.pathname === "\/api\/registrations" \|\| url\.pathname === "\/api\/registrations\/"\) \{\n\s*return await handlePaymentsProxy\(request, env, ctx\);\n\s*\}/g,
  ''
);
fs.writeFileSync('src/server.ts', serverCode);

let viteCode = fs.readFileSync('vite.config.ts', 'utf8');
viteCode = viteCode.replace(
  /url\.pathname\.startsWith\("\/api\/registrations"\)\n\s*\?\s*await handlePaymentsProxy\(webRequest\)\n\s*:\s*/g,
  ''
);
fs.writeFileSync('vite.config.ts', viteCode);
console.log("Cleaned server");
