import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const regex = /const handleSyncRemote = useCallback\(\s*async \(forceFresh = false\) => \{[\s\S]*?\},?\s*\[webhookUrl\],?\s*\);/m;
if (regex.test(code)) {
  code = code.replace(regex, "");
  fs.writeFileSync('src/routes/admin.tsx', code);
  console.log("Removed old handleSyncRemote");
} else {
  console.log("Not found with regex");
}
