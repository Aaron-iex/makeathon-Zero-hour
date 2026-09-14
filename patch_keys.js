import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const targetState = `  const [copiedId, setCopiedId] = useState<string | null>(null);`;
const replacementState = `  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);`;
if (!code.includes('searchInputRef = useRef')) {
  code = code.replace(targetState, replacementState);
}

const targetEffect = `  const filteredRegistrations = useMemo(() => {`;
const replacementEffect = `  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/'
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredRegistrations.length === 1) {
      handleSelectSquad(filteredRegistrations[0]);
      // Remove focus so modal can take over
      searchInputRef.current?.blur();
    }
  };

  const filteredRegistrations = useMemo(() => {`;
if (!code.includes('handleSearchKeyDown')) {
  code = code.replace(targetEffect, replacementEffect);
}

const targetInput = `                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    value={searchTerm}`;
const replacementInput = `                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onKeyDown={handleSearchKeyDown}`;
if (code.includes(targetInput) && !code.includes('onKeyDown={handleSearchKeyDown}')) {
  code = code.replace(targetInput, replacementInput);
}

// Ensure Payment and Check-In pills have fixed min-width 
// The user asked: Payment / Check-In pills: fixed `min-w-[86px]`, paymentRef `max-w-[96px] truncate`
// Let's find them
code = code.replace(
  /<button\n                type="button"\n                onClick={\(e\) => \{\n                  e.stopPropagation\(\);\n                  onTogglePaid\(r\);\n                \}}\n                className=\{`w-[86px]/g,
  `<button\n                type="button"\n                onClick={(e) => {\n                  e.stopPropagation();\n                  onTogglePaid(r);\n                }}\n                className={\`min-w-[86px] w-[86px]`
);

code = code.replace(
  /<button\n              onClick={\(e\) => \{\n                e.stopPropagation\(\);\n                onToggleCheckIn\(r\);\n              \}}\n              className=\{`w-[86px]/g,
  `<button\n              onClick={(e) => {\n                e.stopPropagation();\n                onToggleCheckIn(r);\n              }}\n              className={\`min-w-[86px] w-[86px]`
);

code = code.replace(
  /<div\n              className="text-\[10px\] font-mono-tech text-neutral-500 max-w-\[100px\] truncate mt-1"\n              title=\{r.paymentRef\}\n            >\n              \{r.paymentRef\}\n            <\/div>/g,
  `<div\n              className="text-[10px] font-mono-tech text-neutral-500 max-w-[96px] truncate mt-1"\n              title={r.paymentRef}\n            >\n              {r.paymentRef}\n            </div>`
);


fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched keyboard shortcuts and pills!");
