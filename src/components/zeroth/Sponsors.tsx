import { motion } from "framer-motion";
import { Building2, ShieldCheck } from "lucide-react";

const SPONSORS = [
  {
    name: "Cooper Elevators",
    category: "VERTICAL MOBILITY & INDUSTRIAL AUTOMATION",
    role: "Official Infrastructure Partner",
    image: "/images/sponsors/image.png",
    status: "VERIFIED ALLY",
  },
];

export function Sponsors() {
  return (
    <section id="sponsors" className="border-y border-border bg-card/30 relative overflow-hidden">
      <div className="absolute inset-0 grid-tactical opacity-15 pointer-events-none" />
      <div className="absolute inset-0 scanlines-thin opacity-20 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-primary" />
            <span className="font-mono-tech text-[10px] sm:text-[11px] tracking-[0.25em] text-primary uppercase font-bold">
              // DEFENCE LOGISTICS & ALLIED INDUSTRY
            </span>
            <span className="h-px w-6 bg-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-foreground">
            Strategic Industry <span className="text-alert-gradient">Allies</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-mono-tech text-muted-foreground uppercase tracking-wider">
            Industrial hardware, telemetry support, and real-world deployment infrastructure
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center">
          {SPONSORS.map((sponsor, index) => (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              key={`${sponsor.name}-${index}`}
              className="panel-tactical p-5 sm:p-7 border border-primary/40 bg-card/90 max-w-md w-full ascii-corners relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/60 pb-3">
                <span className="font-mono-tech text-[9px] tracking-[0.16em] sm:tracking-[0.2em] text-accent font-bold uppercase flex items-center gap-1.5 min-w-0 truncate">
                  <Building2 className="size-3 text-accent shrink-0" />
                  <span className="truncate">{sponsor.category}</span>
                </span>
                <span className="font-mono-tech text-[8px] text-terminal-green font-bold tracking-widest uppercase flex items-center gap-1 shrink-0 self-start sm:self-auto">
                  <ShieldCheck className="size-3 shrink-0" />
                  {sponsor.status}
                </span>
              </div>

              <div className="my-5 flex items-center justify-center p-3 bg-card/40 border border-border/40 clip-tactical min-h-[96px]">
                <img
                  src={sponsor.image}
                  alt={`${sponsor.name} logo`}
                  loading="lazy"
                  className="max-w-full h-16 sm:h-20 w-auto object-contain filter contrast-105"
                />
              </div>

              <div className="border-t border-border/60 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono-tech text-[9px] text-muted-foreground uppercase tracking-wider">
                <span className="font-bold text-foreground truncate">{sponsor.name}</span>
                <span className="text-primary font-bold shrink-0">// {sponsor.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
