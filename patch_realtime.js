import fs from 'fs';

let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// 1. Import supabaseClient
const importTarget = `import { TRACKS } from "@/data/zeroth";`;
const importReplacement = `import { TRACKS } from "@/data/zeroth";
import { supabaseClient } from "@/lib/supabase";`;
if (!code.includes('import { supabaseClient }')) {
  code = code.replace(importTarget, importReplacement);
}

// 2. Map function for Supabase payloads
const mapFunction = `function mapSupabasePayloadToRegistration(row: any, existing: Registration): Registration {
  const isExplicitFalse =
    row.paid === false ||
    String(row.paid || "").toLowerCase() === "false" ||
    String(row.paid || "").toUpperCase() === "NO";
    
  let isPaid = false;
  if (!isExplicitFalse) {
     isPaid = Boolean(row.paid) ||
       String(row.paid || "").toLowerCase() === "true" ||
       String(row.paid || "").toUpperCase() === "YES" ||
       Boolean(row.payment_ref);
  }

  return {
    ...existing,
    id: row.id || existing.id,
    teamName: row.team_name || existing.teamName,
    leaderName: row.leader_name || existing.leaderName,
    email: row.email || existing.email,
    phone: row.phone || existing.phone,
    institution: row.institution || existing.institution,
    track: row.track || existing.track,
    teamSize: String(row.team_size || existing.teamSize || "4"),
    brief: row.brief || existing.brief,
    timestamp: row.timestamp || existing.timestamp,
    checkedIn: row.checked_in !== undefined ? Boolean(row.checked_in) : existing.checkedIn,
    paid: isPaid,
    paymentRef: row.payment_ref || existing.paymentRef,
    memberNames: row.member_names || existing.memberNames,
    source: "remote",
    syncedToRemote: true,
  };
}

export function AdminDashboard() {`;

code = code.replace("export function AdminDashboard() {", mapFunction);

// 3. Replace setInterval with Supabase Realtime
const effectTarget = `    // Fetch fresh data in background immediately; UI already shows cached registrations
    handleGentleAutoRefresh();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        handleGentleAutoRefresh();
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleGentleAutoRefresh]);`;

const effectReplacement = `    // Fetch fresh data in background immediately; UI already shows cached registrations
    handleGentleAutoRefresh();

    // Supabase Realtime Subscription
    const channel = supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        (payload) => {
          console.log('Real-time payload received:', payload);
          setRegistrations((prev) => {
            if (payload.eventType === 'INSERT') {
               const exists = prev.find(r => r.id === payload.new.id);
               if (exists) return prev;
               // Need to construct a full registration if it's new
               const newReg = mapSupabasePayloadToRegistration(payload.new, {} as Registration);
               const next = [...prev, newReg];
               saveRegistrationLocally(newReg);
               return next;
            }
            if (payload.eventType === 'UPDATE') {
               const next = prev.map(r => {
                 if (r.id === payload.new.id) {
                   const updated = mapSupabasePayloadToRegistration(payload.new, r);
                   saveRegistrationLocally(updated);
                   return updated;
                 }
                 return r;
               });
               return next;
            }
            if (payload.eventType === 'DELETE') {
               const next = prev.filter(r => r.id !== payload.old.id);
               deleteRegistrationLocally(payload.old.id);
               return next;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [isAuthenticated, handleGentleAutoRefresh]);`;

code = code.replace(effectTarget, effectReplacement);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched admin.tsx real-time sync!");
