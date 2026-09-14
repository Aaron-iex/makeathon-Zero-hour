import fs from 'fs';

let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const regex = /const handleSyncRemote = useCallback\(async \(\) => \{\n\s*await fetchRegistrations\(\);\n\s*\}, \[fetchRegistrations\]\);/;
const replacement = `const handleSyncRemote = useCallback(async (isInitial = true) => {
    await fetchRegistrations(isInitial);
  }, [fetchRegistrations]);`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/routes/admin.tsx', code);
  console.log("Fixed handleSyncRemote");
}
