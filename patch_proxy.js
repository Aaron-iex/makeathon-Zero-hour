import fs from 'fs';

let code = fs.readFileSync('src/server/proxy-handlers.ts', 'utf8');

const regex = /\/\/ Data Sanitization \/ Validation[\s\S]*?const controller = new AbortController\(\);/;
const replacement = `// Data Sanitization / Validation removed to avoid blocking valid submissions
      const controller = new AbortController();`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/server/proxy-handlers.ts', code);
  console.log("Patched proxy-handlers.ts");
} else {
  console.log("Regex failed");
}
