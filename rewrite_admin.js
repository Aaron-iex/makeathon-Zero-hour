import fs from 'fs';

let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// 1. Remove mapSupabasePayloadToRegistration function
const mapRegex = /function mapSupabasePayloadToRegistration\([\s\S]*?\}\n\nexport function AdminDashboard\(\) \{/;
code = code.replace(mapRegex, 'export function AdminDashboard() {');

// 2. Remove supabaseClient import
const importRegex = /import \{ supabaseClient \} from "@\/lib\/supabase";\n/;
code = code.replace(importRegex, '');

// 3. Remove realtime subscriptions
const effectRegex = /\/\/ Supabase Realtime Subscription[\s\S]*?supabaseClient\.removeChannel\(channel\);\n\s*\};\n\s*\}, \[isAuthenticated, fetchRegistrations\]\);/;
const fallbackEffect = `  // Start auto-refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchRegistrations(false);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchRegistrations]);`;

// Just replace the whole useEffect block
const oldEffectFullRegex = /useEffect\(\(\) => \{\n\s*if \(\!isAuthenticated\) return;\n\n\s*fetchRegistrations\(\);\n\n\s*\/\/ Supabase Realtime Subscription[\s\S]*?supabaseClient\.removeChannel\(channel\);\n\s*\};\n\s*\}, \[isAuthenticated, fetchRegistrations\]\);/;

const newEffectFull = `useEffect(() => {
    if (!isAuthenticated) return;
    fetchRegistrations(true); // initial fetch

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchRegistrations(false);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchRegistrations]);`;

if (oldEffectFullRegex.test(code)) {
  code = code.replace(oldEffectFullRegex, newEffectFull);
} else {
  console.log("Could not find the full useEffect block for Supabase!");
}

// 4. Update fetchRegistrations to support a 'isBackground' flag so we don't show loading state on background refresh
const oldFetchRegex = /const fetchRegistrations = useCallback\(async \(\) => \{\n\s*if \(isSyncingRef\.current\) return;\n\s*isSyncingRef\.current = true;\n\s*setIsSyncing\(true\);/;
const newFetch = `const fetchRegistrations = useCallback(async (isInitial = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (isInitial || registrations.length === 0) setIsSyncing(true);`;
if (oldFetchRegex.test(code)) {
  code = code.replace(oldFetchRegex, newFetch);
}

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Rewrote src/routes/admin.tsx");
