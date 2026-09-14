import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// handleSaveMembers
code = code.replace(
  `    // Sync in background
    import("../lib/registrations").then(({ syncMemberNamesToRemote }) => {
      syncMemberNamesToRemote(selectedSquad.id, editingMemberNames).finally(() => {
        setIsSavingMembers(false);
      });
    });`,
  `    // Sync in background via proxy
    fetch("/api/registrations", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${sessionStorage.getItem("zeroth_admin_token")}\`
      },
      body: JSON.stringify({
        action: "updateMemberNames",
        id: selectedSquad.id,
        memberNames: JSON.stringify(editingMemberNames)
      })
    }).finally(() => {
      setIsSavingMembers(false);
    });`
);

// handleToggleCheckIn
code = code.replace(
  `    // Sync in background via proxy
    import("../lib/registrations").then(({ syncCheckInToRemote }) => {
      syncCheckInToRemote(updated.id, updated.checkedIn).catch((err) => {
        console.warn("Check-in sync error:", err);
      });
    });`,
  `    // Sync in background via proxy
    fetch("/api/registrations", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${sessionStorage.getItem("zeroth_admin_token")}\`
      },
      body: JSON.stringify({
        action: "updateCheckIn",
        id: updated.id,
        checkedIn: updated.checkedIn
      })
    }).catch(err => console.warn("Check-in sync error:", err));`
);

// handleTogglePaid -> replaced in handleMarkPaid and handleMarkUnpaid
code = code.replace(
  `    // 2. Sync in background via payments proxy
    setIsMarkingPaid(true);
    try {
      await syncPaymentToRemote(
        updated.id,
        updated.email,
        trimmedRef,
        updated.leaderName,
        updated.teamName,
        true,
      );
    } catch (err) {
      console.warn("Payment sync error:", err);
    } finally {
      setIsMarkingPaid(false);
    }`,
  `    // 2. Sync in background via payments proxy
    setIsMarkingPaid(true);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${sessionStorage.getItem("zeroth_admin_token")}\`
        },
        body: JSON.stringify({
          action: "markPaid",
          id: updated.id,
          email: updated.email,
          paymentRef: trimmedRef,
          leaderName: updated.leaderName,
          teamName: updated.teamName,
          paid: true
        })
      });
    } catch (err) {
      console.warn("Payment sync error:", err);
    } finally {
      setIsMarkingPaid(false);
    }`
);

code = code.replace(
  `    // 2. Sync in background via payments proxy
    setIsMarkingPaid(true);
    try {
      await syncPaymentToRemote(
        updated.id,
        updated.email,
        "",
        updated.leaderName,
        updated.teamName,
        false,
      );
    } catch (err) {
      console.warn("Payment sync error:", err);
    } finally {
      setIsMarkingPaid(false);
    }`,
  `    // 2. Sync in background via payments proxy
    setIsMarkingPaid(true);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${sessionStorage.getItem("zeroth_admin_token")}\`
        },
        body: JSON.stringify({
          action: "markUnpaid",
          id: updated.id,
          email: updated.email,
          leaderName: updated.leaderName,
          teamName: updated.teamName,
          paid: false
        })
      });
    } catch (err) {
      console.warn("Payment sync error:", err);
    } finally {
      setIsMarkingPaid(false);
    }`
);

// handleDeleteSquad
code = code.replace(
  `    // Background sync via proxy
    import("../lib/registrations").then(({ syncDeleteToRemote }) => {
      syncDeleteToRemote(id).catch((err) => {
        console.warn("Delete sync error:", err);
      });
    });`,
  `    // Background sync via proxy
    fetch("/api/registrations", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${sessionStorage.getItem("zeroth_admin_token")}\`
      },
      body: JSON.stringify({
        action: "delete",
        id
      })
    }).catch(err => console.warn("Delete sync error:", err));`
);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched admin.tsx mutations!");
