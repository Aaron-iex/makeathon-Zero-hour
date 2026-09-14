import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const regex = /\/\/ Manual Sync \(can bypass short cache\)\s*const handleSyncRemote = useCallback\(\s*async \(forceFresh = false\) => \{[\s\S]*?\},?\s*\[webhookUrl\],?\s*\);/m;
if (regex.test(code)) {
  code = code.replace(regex, "");
  fs.writeFileSync('src/routes/admin.tsx', code);
  console.log("Removed OLD handleSyncRemote");
} else {
  console.log("Regex failed again.");
}
