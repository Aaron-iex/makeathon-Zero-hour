import fs from 'fs';
let code = fs.readFileSync('src/components/zeroth/RegisterDialog.tsx', 'utf8');

// Add constant at top
code = code.replace(
  'import { useEffect, useState, useCallback, useRef } from "react";',
  `export const REGISTRATION_CLOSED = true;\nimport { useEffect, useState, useCallback, useRef } from "react";`
);

// Add early return for CLOSED state
const renderStart = '  if (!mounted) return null;';
const closedUI = `  if (!mounted) return null;

  if (REGISTRATION_CLOSED && open) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-md" 
          onClick={onClose}
        />
        <div className="relative w-full max-w-md bg-neutral-950 border border-primary/30 p-8 clip-tactical animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 mb-6">
              <X className="size-6 text-primary" />
            </div>
            
            <h2 className="font-mono-tech text-xl text-primary font-bold tracking-widest uppercase">
              SQUAD ENROLLMENT TERMINATED
            </h2>
            
            <div className="space-y-2 text-neutral-400 font-mono-tech text-sm">
              <p>Zeroth Hour registration has closed. We have reached capacity.</p>
              <p className="text-primary/80 mt-4">See you on Sept 23 at Jaya Auditorium — Reporting time 08:30 IST.</p>
            </div>
            
            <div className="pt-6">
              <Button 
                variant="tactical" 
                className="w-full font-mono-tech tracking-widest"
                onClick={onClose}
              >
                CLOSE TERMINAL
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }`;
code = code.replace(renderStart, closedUI);

fs.writeFileSync('src/components/zeroth/RegisterDialog.tsx', code);
console.log("Patched RegisterDialog");
