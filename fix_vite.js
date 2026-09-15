import fs from 'fs';

let code = fs.readFileSync('vite.config.ts', 'utf8');

// Replace the ternary
code = code.replace(
  /const webResponse = url\.pathname\.startsWith\("\/api\/registrations"\)\n\s*\?\s*await handleRegistrationsProxy\(webRequest\)\n\s*:\s*await handlePaymentsProxy\(webRequest\);/g,
  'const webResponse = await handleRegistrationsProxy(webRequest);'
);

// Remove /api/payments check
code = code.replace(
  /\|\|\n\s*url\.pathname === "\/api\/payments" \|\|\n\s*url\.pathname === "\/api\/payments\/"/g,
  ''
);

fs.writeFileSync('vite.config.ts', code);
console.log("Fixed vite config");
