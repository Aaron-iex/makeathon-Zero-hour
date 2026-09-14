import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// 1. Add states
const stateTarget = `  const [paymentRefInput, setPaymentRefInput] = useState("");`;
const stateReplacement = `  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [editingMemberNames, setEditingMemberNames] = useState<string[]>([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);`;
if (!code.includes('editingMemberNames')) {
  code = code.replace(stateTarget, stateReplacement);
}

// 2. Update handleSelectSquad
const selectTarget = `  const handleSelectSquad = useCallback((squad: Registration) => {
    setSelectedSquad(squad);
    setConfirmUnpaid(false);
    setPaymentRefInput(squad.paymentRef || "");
  }, []);`;
const selectReplacement = `  const handleSelectSquad = useCallback((squad: Registration) => {
    setSelectedSquad(squad);
    setConfirmUnpaid(false);
    setPaymentRefInput(squad.paymentRef || "");
    const size = parseInt(squad.teamSize, 10) || 1;
    const initialNames = [...(squad.memberNames || [])];
    while (initialNames.length < size) initialNames.push("");
    setEditingMemberNames(initialNames.slice(0, size));
  }, []);`;
if (!code.includes('initialNames')) {
  code = code.replace(selectTarget, selectReplacement);
}

// 3. Add handleSaveMembers function
const saveTarget = `  const handleToggleCheckIn = useCallback((reg: Registration) => {`;
const saveReplacement = `  const handleSaveMembers = async () => {
    if (!selectedSquad) return;
    setIsSavingMembers(true);
    const updated: Registration = {
      ...selectedSquad,
      memberNames: editingMemberNames,
      lastLocalEdit: Date.now(),
    };
    saveRegistrationLocally(updated);
    setRegistrations((prev) => prev.map((item) => (item.id === selectedSquad.id ? updated : item)));
    setSelectedSquad(updated);
    
    // Sync in background
    import("../lib/registrations").then(({ syncMemberNamesToRemote }) => {
      syncMemberNamesToRemote(selectedSquad.id, editingMemberNames).finally(() => {
        setIsSavingMembers(false);
      });
    });
  };

  const handleToggleCheckIn = useCallback((reg: Registration) => {`;
if (!code.includes('handleSaveMembers')) {
  code = code.replace(saveTarget, saveReplacement);
}

// 4. Update squad detail modal to include Team Members section and reorder UI
const checkInBtnTarget = `              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleCheckIn(selectedSquad)}
                  className={\`font-mono-tech text-xs h-9 justify-center \${
                    selectedSquad.checkedIn
                      ? "border-emerald-600 text-emerald-400 hover:bg-emerald-950/30"
                      : "border-neutral-700 hover:bg-neutral-800"
                  }\`}
                >
                  <CheckCircle2 className="size-3.5 mr-1.5 shrink-0" />
                  {selectedSquad.checkedIn ? "Checked In (Click to Undo)" : "Mark as Checked In"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSquad(selectedSquad.id, selectedSquad.teamName)}
                  className="font-mono-tech text-xs h-9 justify-center text-red-400 border-red-900/40 hover:bg-red-950/40 hover:border-red-800"
                >
                  <Trash2 className="size-3.5 mr-1.5 shrink-0" />
                  Delete Squad
                </Button>
              </div>`;

const membersUI = `              {/* TEAM MEMBERS (TASK A) */}
              <div className="pt-2 pb-1 space-y-2 border-b border-neutral-800/50">
                <label className="flex items-center gap-2 text-[10px] font-mono-tech tracking-widest text-neutral-500 font-bold mb-3">
                  TEAM MEMBERS ({parseInt(selectedSquad.teamSize, 10) || 1})
                </label>
                <div className="space-y-2">
                  {editingMemberNames.map((name, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...editingMemberNames];
                        newNames[idx] = e.target.value;
                        setEditingMemberNames(newNames);
                      }}
                      placeholder={\`Member \${idx + 1} Name\`}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-white outline-none focus:border-primary placeholder:text-neutral-500"
                    />
                  ))}
                </div>
                <div className="flex justify-end pt-1 pb-3">
                  <Button
                    variant="tactical"
                    size="sm"
                    onClick={handleSaveMembers}
                    disabled={isSavingMembers || JSON.stringify(editingMemberNames) === JSON.stringify(selectedSquad.memberNames || [])}
                    className="h-8 px-3 font-mono-tech text-[10px] disabled:opacity-50"
                  >
                    {isSavingMembers ? (
                      <>
                        <RefreshCw className="size-3 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Member Names"
                    )}
                  </Button>
                </div>
              </div>`;

const checkInUI = `              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleCheckIn(selectedSquad)}
                  className={\`font-mono-tech text-xs h-9 justify-center \${
                    selectedSquad.checkedIn
                      ? "border-emerald-600 text-emerald-400 hover:bg-emerald-950/30"
                      : "border-neutral-700 hover:bg-neutral-800"
                  }\`}
                >
                  <CheckCircle2 className="size-3.5 mr-1.5 shrink-0" />
                  {selectedSquad.checkedIn ? "Checked In (Click to Undo)" : "Mark as Checked In"}
                </Button>

                {!selectedSquad.paid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSquad(selectedSquad.id, selectedSquad.teamName)}
                    className="font-mono-tech text-xs h-9 justify-center text-red-400 border-red-900/40 hover:bg-red-950/40 hover:border-red-800"
                  >
                    <Trash2 className="size-3.5 mr-1.5 shrink-0" />
                    Delete Squad
                  </Button>
                )}
              </div>`;

if (code.includes(checkInBtnTarget) && !code.includes('TEAM MEMBERS (TASK A)')) {
  code = code.replace(checkInBtnTarget, membersUI + '\n' + checkInUI);
}

// 5. Hide delete button in RegistrationRow
const rowDeleteTarget = `          <div
            className={\`absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-l from-neutral-900 via-neutral-900 to-transparent flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4 \${
              isOpen ? "opacity-100" : ""
            }\`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePaid(r);
              }}
              className="size-8 inline-flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
              title="Toggle payment status"
            >
              <CreditCard className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSquad(r.id, r.teamName);
              }}
              className="size-8 inline-flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-red-400/70 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30 transition-colors"
              title="Delete squad"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>`;

const rowDeleteReplacement = `          <div
            className={\`absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-l from-neutral-900 via-neutral-900 to-transparent flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4 \${
              isOpen ? "opacity-100" : ""
            }\`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePaid(r);
              }}
              className="size-8 inline-flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
              title="Toggle payment status"
            >
              <CreditCard className="size-3.5" />
            </button>
            {!r.paid && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSquad(r.id, r.teamName);
                }}
                className="size-8 inline-flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-red-400/70 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30 transition-colors"
                title="Delete squad"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>`;

if (code.includes(rowDeleteTarget) && !code.includes('!r.paid && (')) {
  code = code.replace(rowDeleteTarget, rowDeleteReplacement);
}

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("src/routes/admin.tsx updated");
