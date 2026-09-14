import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// Fix Pass ID cell
code = code.replace(
  '<td\n        className="py-3.5 px-4 font-mono-tech font-bold text-primary whitespace-nowrap"\n        onClick={(e) => e.stopPropagation()}\n      >',
  '<td\n        className="py-3.5 px-4 font-mono-tech font-bold text-primary whitespace-nowrap sticky left-0 z-10 bg-neutral-900 group-hover:bg-neutral-800/60 align-middle"\n        onClick={(e) => e.stopPropagation()}\n      >'
);

// Fix actions cell (at the end of RegistrationRow)
const actionsTarget = `<td className="py-3.5 px-4 relative w-[100px]">`;
const actionsReplacement = `<td className="py-3.5 px-4 relative w-[112px] min-w-[112px] sticky right-0 z-10 bg-neutral-900 group-hover:bg-neutral-800/60 align-middle">`;
code = code.replace(actionsTarget, actionsReplacement);

// Fix delete button hiding logic in RegistrationRow to use Lock icon
const deleteTarget = `            {!r.paid && (
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
            )}`;

const deleteReplacement = `            {r.paid ? (
              <div 
                className="size-8 inline-flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-600"
                title="Paid squad — Revert to Unpaid to enable delete"
              >
                <Lock className="size-3.5" />
              </div>
            ) : (
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
            )}`;

if (code.includes(deleteTarget)) {
  code = code.replace(deleteTarget, deleteReplacement);
}

// Fix squad modal delete button to use Lock
const modalDeleteTarget = `                {!selectedSquad.paid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSquad(selectedSquad.id, selectedSquad.teamName)}
                    className="font-mono-tech text-xs h-9 justify-center text-red-400 border-red-900/40 hover:bg-red-950/40 hover:border-red-800"
                  >
                    <Trash2 className="size-3.5 mr-1.5 shrink-0" />
                    Delete Squad
                  </Button>
                )}`;

const modalDeleteReplacement = `                {selectedSquad.paid ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="font-mono-tech text-xs h-9 justify-center text-neutral-600 border-neutral-800 bg-neutral-900/50"
                    title="Paid squad — Revert to Unpaid to enable delete"
                  >
                    <Lock className="size-3.5 mr-1.5 shrink-0" />
                    Delete Squad
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSquad(selectedSquad.id, selectedSquad.teamName)}
                    className="font-mono-tech text-xs h-9 justify-center text-red-400 border-red-900/40 hover:bg-red-950/40 hover:border-red-800"
                  >
                    <Trash2 className="size-3.5 mr-1.5 shrink-0" />
                    Delete Squad
                  </Button>
                )}`;

if (code.includes(modalDeleteTarget)) {
  code = code.replace(modalDeleteTarget, modalDeleteReplacement);
}

// Ensure align-middle on tds
code = code.replace(
  /<td className="py-3.5 px-4/g,
  '<td className="py-3.5 px-4 align-middle'
);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched row and actions!");
