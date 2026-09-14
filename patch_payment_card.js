import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// 1. Payment card overflow-x-hidden
code = code.replace(
  '<div className="bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-3 space-y-2">',
  '<div className="bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-3 space-y-2 overflow-x-hidden">'
);

// 2. Container flex-col
code = code.replace(
  '<div className="flex flex-col sm:flex-row gap-2">',
  '<div className="flex flex-col gap-2">'
);

// 3. Input w-full min-w-0
code = code.replace(
  'className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-white outline-none focus:border-primary placeholder:text-neutral-500"',
  'className="w-full min-w-0 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-white outline-none focus:border-primary placeholder:text-neutral-500"'
);

// 4. Button group flex-wrap
code = code.replace(
  '<div className="flex items-center gap-2 shrink-0">',
  '<div className="flex flex-wrap items-center gap-2">'
);

// 5. Remove shrink-0 from Mark Paid button
code = code.replace(
  'className="h-9 px-3 font-mono-tech text-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"',
  'className="h-9 px-3 font-mono-tech text-xs disabled:opacity-50 disabled:cursor-not-allowed"'
);

// 6. Revert Confirm group
code = code.replace(
  '<div className="flex gap-2">',
  '<div className="flex flex-wrap gap-2 w-full mt-1">'
);

// 7. Revert button w-auto
code = code.replace(
  'className="h-9 px-3 font-mono-tech text-xs border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"',
  'className="h-9 px-3 w-auto font-mono-tech text-xs border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"'
);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched payment card!");
