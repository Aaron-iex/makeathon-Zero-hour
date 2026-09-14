import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// Squad Name
code = code.replace(
  '<td className="py-3.5 px-4 align-middle min-w-[150px] max-w-[220px]">',
  '<td className="py-3.5 px-3 align-middle min-w-[130px] max-w-[180px]">'
);

// Leader & Contact
code = code.replace(
  '<td className="py-3.5 px-4 align-middle min-w-[190px]" onClick={(e) => e.stopPropagation()}>',
  '<td className="py-3.5 px-3 align-middle min-w-[160px]" onClick={(e) => e.stopPropagation()}>'
);
// Email max width truncate
code = code.replace(
  'max-w-[160px] truncate',
  'max-w-[140px] truncate'
);

// Institution
code = code.replace(
  '<td className="py-3.5 px-4 align-middle text-neutral-300 min-w-[160px] max-w-[220px]">',
  '<td className="py-3.5 px-3 align-middle text-neutral-300 min-w-[130px] max-w-[180px]">'
);
code = code.replace(
  '<span className="break-words" title={r.institution || "—"}>',
  '<span className="break-words line-clamp-2" title={r.institution || "—"}>'
);

// Track / Sector
code = code.replace(
  '<span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono-tech font-semibold bg-neutral-800/80 border border-neutral-700/50 text-accent">',
  '<span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono-tech font-semibold bg-neutral-800/80 border border-neutral-700/50 text-accent max-w-[140px] truncate align-bottom" title={r.track}>'
);

// Check-in desk usability: Autofocus and Keyboard shortcuts
// Search Input larger hit area
code = code.replace(
  'className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 font-mono-tech text-xs text-white placeholder:text-neutral-500 outline-none focus:border-primary"',
  'className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 font-mono-tech text-xs text-white placeholder:text-neutral-500 outline-none focus:border-primary"'
);
code = code.replace(
  '<input\n                    type="text"\n                    value={searchTerm}',
  '<input\n                    ref={searchInputRef}\n                    autoFocus\n                    type="text"\n                    value={searchTerm}'
);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched widths and autofocus!");
