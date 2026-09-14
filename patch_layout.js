import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// FIX 1: Outer roster card and table wrapper
code = code.replace(
  'className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl"',
  'className="bg-neutral-900/60 border border-neutral-800 rounded-xl shadow-xl"'
);
code = code.replace(
  '<div className="p-4 border-b border-neutral-800 flex items-center justify-between">',
  '<div className="p-4 border-b border-neutral-800 flex items-center justify-between rounded-t-xl bg-neutral-900/60">'
);
code = code.replace(
  '<div className="overflow-x-auto">',
  '<div className="overflow-x-auto rounded-b-xl">'
);

// FIX 1: Table min-w and align-middle
code = code.replace(
  '<table className="w-full text-left text-xs border-collapse">',
  '<table className="w-full min-w-[960px] text-left text-xs border-collapse align-middle">'
);

// FIX 2: Sticky headers
code = code.replace(
  '<th className="py-3 px-4 font-semibold">Pass ID</th>',
  '<th className="py-3 px-4 font-semibold sticky left-0 z-10 bg-neutral-900 align-middle">Pass ID</th>'
);
code = code.replace(
  '<th className="py-3 px-4 text-right font-semibold">Actions</th>',
  '<th className="py-3 px-4 text-right font-semibold sticky right-0 z-10 bg-neutral-900 w-[112px] min-w-[112px] align-middle">Actions</th>'
);
// Also add align-middle to all other th
code = code.replace(
  /<th className="py-3 px-4 font-semibold">/g,
  '<th className="py-3 px-4 font-semibold align-middle">'
);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched Fix 1 and 2 headers");
