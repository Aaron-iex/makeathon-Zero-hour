import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

const regex = /\/\*\*\n \* Pulls payment statuses live from the comms automation script via caching proxy[\s\S]*?return \{ success: false, data: \{\} \};\n  \}\n\}/;
code = code.replace(regex, '');

fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Deleted fetchPaymentStatuses");
