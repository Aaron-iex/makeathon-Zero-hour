import fs from 'fs';
const file = fs.readFileSync('.output/public/assets/index-BBtnDr-z.js', 'utf8');
if (file.includes('process.env.SUPABASE_URL')) {
  console.log('process.env.SUPABASE_URL is unreplaced in bundle');
} else {
  console.log('process.env is replaced or not present');
}
