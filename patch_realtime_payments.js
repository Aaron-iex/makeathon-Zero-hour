import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const targetEffect = `    // Supabase Realtime Subscription
    const channel = supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },`;

const newEffect = `    // Supabase Realtime Subscription
    const channel = supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          console.log('Real-time payment payload:', payload);
          setRegistrations((prev) => {
             if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                return prev.map(r => {
                  if (r.id === payload.new.id) {
                     const updated = { ...r, paid: true, paymentRef: payload.new.payment_ref, lastLocalEdit: Date.now() };
                     saveRegistrationLocally(updated);
                     return updated;
                  }
                  return r;
                });
             }
             if (payload.eventType === 'DELETE') {
                return prev.map(r => {
                  if (r.id === payload.old.id) {
                     const updated = { ...r, paid: false, paymentRef: undefined, lastLocalEdit: Date.now() };
                     saveRegistrationLocally(updated);
                     return updated;
                  }
                  return r;
                });
             }
             return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },`;

if (code.includes(targetEffect)) {
  code = code.replace(targetEffect, newEffect);
}

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched admin.tsx phase 3 payments realtime!");
