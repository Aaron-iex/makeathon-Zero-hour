const fs = require('fs');
let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// Use a simpler string replacement for the start of the block
const target = `      if (Array.isArray(json)) {
        for (const item of json as Record<string, unknown>[]) {`;

const replacement = `      let targetJson = json;
      if (json && typeof json === "object" && !Array.isArray(json) && Array.isArray((json as any).data)) {
        targetJson = (json as any).data;
      }
      
      if (Array.isArray(targetJson)) {
        for (const item of targetJson as Record<string, unknown>[]) {`;

code = code.replace(target, replacement);

const target2 = `} else if (json && typeof json === "object") {
        for (const [id, val] of Object.entries(json as Record<string, unknown>)) {`;

const replacement2 = `} else if (targetJson && typeof targetJson === "object") {
        for (const [id, val] of Object.entries(targetJson as Record<string, unknown>)) {`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Patched!");
