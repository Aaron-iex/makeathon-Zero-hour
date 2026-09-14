import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// 1. Remove getStoredRegistrations from useState
code = code.replace(
  `  // Render stored registrations IMMEDIATELY on load (0ms UI paint, non-blocking)
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    if (typeof window !== "undefined") {
      return getStoredRegistrations();
    }
    return [];
  });`,
  `  // Wait for Supabase load
  const [registrations, setRegistrations] = useState<Registration[]>([]);`
);

// 2. Remove clearStoredRegistrations on login and logout
code = code.replace(/clearStoredRegistrations\(\);\n/g, "");

// 3. Remove dependencies from registrations.ts import
const regImports = `  getStoredRegistrations,
  saveRegistrationLocally,
  deleteRegistrationLocally,
  exportRegistrationsToCsv,
  getGoogleSheetsWebhookUrl,
  setGoogleSheetsWebhookUrl,
  getPaymentsWebhookUrl,
  setPaymentsWebhookUrl,
  fetchRemoteRegistrations,
  clearStoredRegistrations,
  syncCheckInToRemote,
  syncDeleteToRemote,
  syncPaymentToRemote,
  BACKUP_GOOGLE_FORM_URL,
  type Registration,`;

const regImportsNew = `  getStoredRegistrations,
  saveRegistrationLocally,
  deleteRegistrationLocally,
  exportRegistrationsToCsv,
  getGoogleSheetsWebhookUrl,
  setGoogleSheetsWebhookUrl,
  getPaymentsWebhookUrl,
  setPaymentsWebhookUrl,
  BACKUP_GOOGLE_FORM_URL,
  type Registration,`;
  
code = code.replace(regImports, regImportsNew);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched admin.tsx phase 1!");
