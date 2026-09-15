import fs from 'fs';

let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// Patch 1: State
code = code.replace(
  'const [editingMemberNames, setEditingMemberNames] = useState<string[]>([]);',
  'const [editingMemberNames, setEditingMemberNames] = useState<string[]>([]);\n  const [isEditingMembersUI, setIsEditingMembersUI] = useState(false);'
);

// Patch 2: handleSelectSquad
const handleSelectRegex = /const handleSelectSquad = useCallback\(\(squad: Registration\) => \{[\s\S]*?setEditingMemberNames\(initialNames\.slice\(0, size\)\);\n  \}, \[\]\);/;
const handleSelectReplacement = `const handleSelectSquad = useCallback((squad: Registration) => {
    setSelectedSquad(squad);
    setConfirmUnpaid(false);
    setPaymentRefInput(squad.paymentRef || "");
    const size = parseInt(squad.teamSize, 10) || 1;
    const memberCount = Math.max(0, size - 1);
    const initialNames = [...(squad.memberNames || [])];
    while (initialNames.length < memberCount) initialNames.push("");
    const finalNames = initialNames.slice(0, memberCount);
    setEditingMemberNames(finalNames);
    setIsEditingMembersUI(!finalNames.some(n => n.trim() !== ""));
  }, []);`;
code = code.replace(handleSelectRegex, handleSelectReplacement);

// Patch 3: handleSaveMembers
const handleSaveRegex = /setSelectedSquad\(updated\);\n\s*\/\* 2\. Sync in background/;
const handleSaveReplacement = `setSelectedSquad(updated);\n    setIsEditingMembersUI(false);\n    /* 2. Sync in background`;
code = code.replace(handleSaveRegex, handleSaveReplacement);

// Patch 4: UI
const uiRegex = /\{\/\* TEAM MEMBERS \(TASK A\) \*\/\}\n\s*<div className="pt-2 pb-1 space-y-2 border-b border-neutral-800\/50">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">/;
const uiReplacement = `{/* TEAM MEMBERS (TASK A) */}
              {(parseInt(selectedSquad.teamSize, 10) || 1) > 1 && (
                <div className="pt-2 pb-1 space-y-2 border-b border-neutral-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-[10px] font-mono-tech tracking-widest text-neutral-500 font-bold">
                      TEAM MEMBERS ({Math.max(0, (parseInt(selectedSquad.teamSize, 10) || 1) - 1)})
                    </label>
                    {!isEditingMembersUI && (
                      <button
                        onClick={() => setIsEditingMembersUI(true)}
                        className="text-[10px] font-mono-tech text-primary hover:text-primary/80 transition-colors"
                      >
                        [ EDIT ]
                      </button>
                    )}
                  </div>
                  
                  {isEditingMembersUI ? (
                    <>
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
                    </>
                  ) : (
                    <div className="space-y-1 pb-3">
                      {editingMemberNames.map((name, idx) => (
                        <div key={idx} className="text-xs text-neutral-300 font-mono-tech flex items-center">
                          <span className="text-neutral-500 w-4 text-right mr-2">{idx + 1}.</span> 
                          {name.trim() ? (
                            <span className="text-white font-semibold uppercase">{name.trim()}</span>
                          ) : (
                            <span className="text-neutral-600 italic">Not provided</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">`;
code = code.replace(uiRegex, uiReplacement);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched admin.tsx");
