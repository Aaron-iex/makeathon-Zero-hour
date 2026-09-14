const fs = require('fs');
let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

const target = `    } catch {
      // Direct fallback
      if (!url) return { success: false, data: {} };`;

const replacement = `    } catch (err) {
      console.error("Proxy fetch for payments failed:", err);
      // Direct fallback
      if (!url) return { success: false, data: {} };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Patched 2!");
