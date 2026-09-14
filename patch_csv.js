import fs from 'fs';

let code = fs.readFileSync('src/lib/registrations.ts', 'utf8');

// 1. Remove fetchRemoteRegistrations, fetchPaymentStatuses, syncCheckInToRemote, syncPaymentToRemote, syncDeleteToRemote, syncMemberNamesToRemote
// Instead of complex regex, we can just replace everything from `export async function fetchRemoteRegistrations` to the end of the file with just `exportRegistrationsToCsv`
// Wait, `submitRegistrationData` is also there. Let's see the order.
