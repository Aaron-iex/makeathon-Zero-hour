import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

const target = `const newReg: Registration = {
    ...formData,
    id,
    timestamp,
    status: "confirmed",
    checkedIn: false,
    source: "local",
    syncedToRemote: false,
  };`;

const replacement = `const newReg = {
    ...formData,
    id,
    timestamp,
    status: "confirmed",
    checkedIn: false,
    source: "local",
    syncedToRemote: false,
    action: "register"
  };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/lib/registrations.ts', code);
  console.log("Patched registrations.ts");
} else {
  console.log("String not found");
}
