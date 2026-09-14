import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importRegistrations() {
  const csv = readFileSync('/home/aaron-nissi/Downloads/Zeroth Hour - Registrations - Sheet1.csv', 'utf-8');
  const records = parse(csv, { columns: false, skip_empty_lines: true });

  // Skip header row
  const rows = records.slice(1).filter(r => r[0] && r[0].startsWith('ZH-'));

  const payload = rows.map(r => ({
    id: r[0],
    team_name: r[1],
    leader_name: r[2],
    email: r[3],
    phone: r[4],
    institution: r[5] || null,
    track: r[6] || 'General',
    team_size: parseInt(r[7], 10) || 4,
    brief: r[8] || null,
    timestamp: new Date(r[9]).toISOString(),
    checked_in: (r[10] || '').toUpperCase() === 'YES',
    member_names: [],  // empty array
    remarks: r[12] || null,
    source: 'import'
  }));

  const { error } = await supabase.from('registrations').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  console.log(`✅ Imported ${payload.length} registrations`);
}

async function importThankYouLog() {
  const csv = readFileSync('/home/aaron-nissi/Downloads/Zeroth Hour - Comms Log - ThankYouLog.csv', 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  const payload = records.map(r => ({
    id: r.id,
    email: r.email,
    sent_at: r.sentAt
  }));

  const { error } = await supabase.from('thank_you_log').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  console.log(`✅ Imported ${payload.length} thank-you log entries`);
}

async function main() {
  await importRegistrations();
  await importThankYouLog();
  console.log('🎉 All done');
}

main().catch(e => { console.error(e); process.exit(1); });
