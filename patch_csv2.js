import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// 1. Add remarks to interface
code = code.replace(
  '  source?: "remote" | "local";',
  '  source?: string;\n  remarks?: string;'
);

// 2. Add columns to CSV
code = code.replace(
  `    "Payment Reference ID",
  ];`,
  `    "Payment Reference ID",
    "Remarks",
    "Source",
  ];`
);

code = code.replace(
  `    r.paid ? "PAID" : "UNPAID",
    \`"\${(r.paymentRef || "").replace(/"/g, '""')}"\`,
  ]);`,
  `    r.paid ? "PAID" : "UNPAID",
    \`"\${(r.paymentRef || "").replace(/"/g, '""')}"\`,
    \`"\${(r.remarks || "").replace(/"/g, '""')}"\`,
    \`"\${(r.source || "").replace(/"/g, '""')}"\`,
  ]);`
);

fs.writeFileSync('src/lib/registrations.ts', code);
console.log("Patched CSV!");
