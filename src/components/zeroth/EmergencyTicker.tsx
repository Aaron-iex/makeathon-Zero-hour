import { Radio } from "lucide-react";
import { useState, useEffect } from "react";

const TICKER_ITEMS = [
  "EVENT DATE: SEPT 23 // REGISTRATION: ₹200 PER SQUAD — QUEUE IS OPEN",
  "DEFCON 1 INITIATED: 5-HOUR PLANETARY DEFENCE SPRINT",
  "PRIZE CACHE: ₹22,000 OVERALL + MERCH & CERTIFICATES",
  "VENUE: JAYA AUDITORIUM · JAYA ENGINEERING COLLEGE, CHENNAI",
  "STUDENT HARDWARE MAKEATHON // OPEN TO ALL DEPARTMENTS & COLLEGES",
  "FIVE CRISIS THREAT SECTORS LIVE: EARTHQUAKE · SEA LEVEL · MARS · RF BLACKOUT · HEATWAVE",
];

export function EmergencyTicker() {
  const [txHex, setTxHex] = useState("0xA4F1");

  useEffect(() => {
    const id = setInterval(() => {
      setTxHex(
        `0x${Math.floor(Math.random() * 0xffff)
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}`,
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const content = TICKER_ITEMS.join("   │   ");

  return (
    <aside className="relative flex h-8 w-full items-center overflow-hidden border-b border-primary/40 bg-black/90 font-mono-tech text-[11px] tracking-[0.18em] text-primary select-none hover:scale-[1.005] transition-transform duration-300">
      <div className="z-10 flex h-full shrink-0 items-center gap-2 bg-primary px-3 sm:px-3.5 text-primary-foreground shadow-[4px_0_16px_rgba(224,76,17,0.4)]">
        <Radio className="size-3.5 animate-pulse" aria-hidden />
        <span className="font-bold uppercase tracking-[0.2em] text-[10px]">LIVE BROADCAST</span>
        <span className="hidden sm:inline-block font-mono-tech text-[8px] bg-black/35 px-1.5 py-0.5 rounded text-white tracking-widest">
          TX {txHex}
        </span>
      </div>

      <div className="relative flex flex-1 items-center overflow-hidden py-1">
        <div className="flex whitespace-nowrap animate-ticker" aria-hidden>
          <span className="px-4 font-bold">{content}</span>
          <span className="px-4 font-bold">{content}</span>
        </div>
      </div>
    </aside>
  );
}
