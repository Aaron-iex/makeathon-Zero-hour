import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const target = `          <button
            type="button"
            onClick={() => onDeleteSquad(r.id, r.teamName)}
            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
            title="Delete Squad from roster & Google Sheets"
          >
            <Trash2 className="size-3.5" />
          </button>`;

const replacement = `          {!r.paid && (
            <button
              type="button"
              onClick={() => onDeleteSquad(r.id, r.teamName)}
              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
              title="Delete Squad from roster & Google Sheets"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}`;

if (code.includes(target) && !code.includes('!r.paid && (')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/routes/admin.tsx', code);
  console.log("RegistrationRow patched!");
} else {
  console.log("Could not find RegistrationRow delete button");
}
