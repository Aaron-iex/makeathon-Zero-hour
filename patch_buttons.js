import fs from 'fs';

function replaceInFile(filename, replacements, needsImport = true) {
  let code = fs.readFileSync(filename, 'utf8');
  if (needsImport && !code.includes("REGISTRATION_CLOSED")) {
    const importStatement = `import { REGISTRATION_CLOSED } from "@/components/zeroth/RegisterDialog";\n`;
    code = importStatement + code;
  }
  for (const [regex, replacement] of replacements) {
    code = code.replace(regex, replacement);
  }
  fs.writeFileSync(filename, code);
}

// 1. Hero.tsx
replaceInFile('src/components/zeroth/Hero.tsx', [
  [/<Button\n\s*variant="alert"\n\s*size="default"\n\s*onClick=\{onRegister\}[\s\S]*?<\/Button>/, 
  `{REGISTRATION_CLOSED ? (
              <div className="w-full sm:w-auto h-12 sm:h-11 font-mono-tech font-bold text-[13px] bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center uppercase tracking-widest clip-tactical select-none px-6">
                REGISTRATIONS CLOSED
              </div>
            ) : (
              <Button
                variant="alert"
                size="default"
                onClick={onRegister}
                className="w-full sm:w-auto h-12 sm:h-11 font-bold touch-manipulation group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              >
                <Flame className="size-4" aria-hidden />
                Enlist your squad
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            )}`]
]);

// 2. Roadmap.tsx
replaceInFile('src/components/zeroth/Roadmap.tsx', [
  [/<Button\n\s*variant="alert"\n\s*size="lg"\n\s*className="px-10 h-12 text-sm uppercase tracking-widest clip-tactical group"\n\s*onClick=\{onRegister\}\n\s*>\n\s*<span className="relative z-10 flex items-center gap-2">\n\s*Enlist Now\n\s*<ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" \/>\n\s*<\/span>\n\s*<\/Button>/,
  `{REGISTRATION_CLOSED ? (
            <div className="inline-flex items-center justify-center h-12 px-10 font-mono-tech font-bold text-sm bg-neutral-900 border border-neutral-800 text-neutral-500 uppercase tracking-widest clip-tactical select-none">
              REGISTRATIONS CLOSED
            </div>
          ) : (
            <Button
              variant="alert"
              size="lg"
              className="px-10 h-12 text-sm uppercase tracking-widest clip-tactical group"
              onClick={onRegister}
            >
              <span className="relative z-10 flex items-center gap-2">
                Enlist Now
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          )}`]
]);

// 3. SiteNav.tsx
replaceInFile('src/components/zeroth/SiteNav.tsx', [
  [/<Button variant="alert" size="default" className="ml-3" onClick=\{onRegister\}>\n\s*Register\n\s*<\/Button>/,
  `{REGISTRATION_CLOSED ? (
            <div className="ml-3 h-10 px-4 font-mono-tech font-bold text-xs bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center uppercase tracking-widest clip-tactical select-none">
              CLOSED
            </div>
          ) : (
            <Button variant="alert" size="default" className="ml-3" onClick={onRegister}>
              Register
            </Button>
          )}`],
  [/<Button\n\s*variant="alert"\n\s*className="w-full justify-between"\n\s*onClick=\{onRegister\}\n\s*>\n\s*<span>Register Now<\/span>\n\s*<ChevronRight className="size-4" \/>\n\s*<\/Button>/,
  `{REGISTRATION_CLOSED ? (
                <div className="w-full h-10 px-4 font-mono-tech font-bold text-sm bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center uppercase tracking-widest clip-tactical select-none">
                  REGISTRATIONS CLOSED
                </div>
              ) : (
                <Button
                  variant="alert"
                  className="w-full justify-between"
                  onClick={onRegister}
                >
                  <span>Register Now</span>
                  <ChevronRight className="size-4" />
                </Button>
              )}`]
]);

// 4. Sectors.tsx
replaceInFile('src/components/zeroth/Sectors.tsx', [
  [/<Button\n\s*variant="alert"\n\s*className="w-full uppercase tracking-wider font-bold"\n\s*onClick=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*onRegister\(track\.title\);\n\s*\}\}\n\s*>\n\s*Select Sector\n\s*<\/Button>/,
  `{REGISTRATION_CLOSED ? (
                      <div className="w-full h-10 font-mono-tech font-bold text-sm bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center uppercase tracking-widest clip-tactical select-none">
                        CLOSED
                      </div>
                    ) : (
                      <Button
                        variant="alert"
                        className="w-full uppercase tracking-wider font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegister(track.title);
                        }}
                      >
                        Select Sector
                      </Button>
                    )}`],
  [/<Button\n\s*variant="alert"\n\s*size="lg"\n\s*className="w-full sm:w-auto px-8 py-6 text-sm uppercase tracking-widest font-bold clip-tactical group"\n\s*onClick=\{\(\) => onRegister\(title\)\}\n\s*>\n\s*<span className="relative z-10 flex items-center gap-2">\n\s*Secure Sector Registration\n\s*<ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" \/>\n\s*<\/span>\n\s*<\/Button>/,
  `{REGISTRATION_CLOSED ? (
                        <div className="w-full sm:w-auto h-14 px-8 font-mono-tech font-bold text-sm bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center uppercase tracking-widest clip-tactical select-none">
                          REGISTRATIONS CLOSED
                        </div>
                      ) : (
                        <Button
                          variant="alert"
                          size="lg"
                          className="w-full sm:w-auto px-8 py-6 text-sm uppercase tracking-widest font-bold clip-tactical group"
                          onClick={() => onRegister(title)}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            Secure Sector Registration
                            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      )}`]
]);

console.log("Patched all component buttons");
