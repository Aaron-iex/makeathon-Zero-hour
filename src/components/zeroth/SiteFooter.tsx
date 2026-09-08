import { Github, Radio, ShieldAlert, Satellite } from "lucide-react";
import { motion } from "framer-motion";

export function SiteFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-border bg-card/40"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center border border-primary/60 bg-primary/15 text-primary clip-tactical">
              <ShieldAlert className="size-4.5" aria-hidden />
            </span>
            <span className="font-display text-sm font-black tracking-[0.2em]">ZEROTH HOUR</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Global disaster mitigation and planetary survival tech makeathon. 5 hours, five threat
            sectors, one deadline that never moves.
          </p>
          <div className="mt-5 flex gap-2">
            {[Radio, Satellite, Github].map((Icon, i) => (
              <a
                key={i}
                href="#top"
                className="size-10 place-items-center border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary clip-tactical min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Communication channel"
              >
                <Icon className="size-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <nav>
          <h4 className="font-mono-tech text-[11px] tracking-[0.22em] text-accent">NAVIGATION</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              ["#", "Home"],
              ["#events", "Event schedule"],
              ["#about", "Mission briefing & FAQ"],
            ].map(([href, label], idx, arr) => (
              <li key={href}>
                <span className="font-mono-tech text-muted-foreground mr-1.5" aria-hidden>
                  {idx === arr.length - 1 ? "└──" : "├──"}
                </span>
                <a
                  href={href}
                  className="transition-colors hover:text-accent nav-link-hover min-h-[44px] inline-flex items-center touch-manipulation"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h4 className="font-mono-tech text-[11px] tracking-[0.22em] text-accent">
            EMERGENCY CONTACT
          </h4>
          <ul className="mt-4 space-y-2 font-mono-tech text-xs text-muted-foreground">
            <li>
              <span className="font-mono-tech text-muted-foreground mr-1.5" aria-hidden>
                ├──
              </span>
              <a
                href="tel:+916381198548"
                className="transition-colors hover:text-accent nav-link-hover inline-flex items-center min-h-[44px] touch-manipulation"
              >
                +91-6381198548
              </a>
            </li>
            <li>
              <span className="font-mono-tech text-muted-foreground mr-1.5" aria-hidden>
                ├──
              </span>
              <a
                href="mailto:mylabathulaaaronnissi@gmail.com"
                className="transition-colors hover:text-accent nav-link-hover inline-flex items-center min-h-[44px] touch-manipulation break-all"
              >
                PRESS: mylabathulaaaronnissi@gmail.com
              </a>
            </li>
            <li>
              <span className="font-mono-tech text-muted-foreground mr-1.5" aria-hidden>
                └──
              </span>
              STATUS: DEFCON 1 — SEPT 23 · 5-HOUR SPRINT
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] font-mono-tech text-[10px] tracking-[0.2em] text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-3.5 text-[9px] uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-terminal-green animate-pulse" />
            CPU: NOMINAL
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-radar-cyan" />
            NET: ARMED
          </span>
          <span className="flex items-center gap-1.5 text-accent font-bold">
            <span className="size-1.5 rounded-full bg-accent" />
            SYNC: DEFCON 1
          </span>
        </div>
        <span className="text-center">© 2026 PROJECT ZEROTH HOUR® — JAYA ENGINEERING COLLEGE</span>
        <span className="font-mono-tech text-[9px] text-muted-foreground/80">
          ZH // REV 2.6 // 2026
        </span>
      </div>
    </motion.footer>
  );
}
