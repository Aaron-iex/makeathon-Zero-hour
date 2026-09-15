import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const intervalRegex = /const interval = setInterval\([\s\S]*?\}, 25000\);\n/g;
code = code.replace(intervalRegex, '');

const clearIntervalRegex = /clearInterval\(interval\);/g;
code = code.replace(clearIntervalRegex, '');

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Removed interval");
