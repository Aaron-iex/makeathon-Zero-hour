import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

code = code.replace(/memberNames: JSON\.stringify\(memberNames\)/g, 'memberNames: memberNames');

fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Patched JSON.stringify in registrations.ts");
