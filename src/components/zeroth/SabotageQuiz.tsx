import {
  Gamepad2,
  ShieldAlert,
  Trophy,
  WifiOff,
  Keyboard,
  Users2,
  EyeOff,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";

const SABOTAGES = [
  {
    code: "EW-01",
    name: "EMP Wi-Fi Jammer",
    duration: "5 MIN LOCKOUT",
    effect: "Target team's internet connection is suspended. They must rely on offline knowledge.",
    icon: WifiOff,
    token: "var(--primary)",
    badgeBg: "bg-primary/15 border-primary/50 text-primary",
  },
  {
    code: "EW-02",
    name: "Keyboard Lockout",
    duration: "5 MIN LOCKOUT",
    effect: "Target team's lead coder must code using only a touch keyboard or with one hand.",
    icon: Keyboard,
    token: "var(--accent)",
    badgeBg: "bg-accent/15 border-accent/50 text-accent",
  },
  {
    code: "EW-03",
    name: "Telemetry Jam",
    duration: "10 MIN LOCKOUT",
    effect: "Restricts target team's communication and access to Faculty/Student mentors.",
    icon: EyeOff,
    token: "var(--radar-cyan)",
    badgeBg:
      "bg-[color-mix(in_oklab,var(--radar-cyan)_15%,transparent)] border-[color-mix(in_oklab,var(--radar-cyan)_50%,transparent)] text-[var(--radar-cyan)]",
  },
  {
    code: "EW-04",
    name: "Noise Injection",
    duration: "5 MIN LOCKOUT",
    effect:
      "Target team must wear headphones playing heavy static noise to test focus under pressure.",
    icon: ShieldAlert,
    token: "var(--primary)",
    badgeBg: "bg-primary/15 border-primary/50 text-primary",
  },
];

export function SabotageQuiz() {
  return (
    <section id="sabotage-quiz" className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
      <div className="panel-tactical p-5 sm:p-10 relative overflow-hidden border border-primary/40 bg-card/90">
        <div className="absolute inset-0 grid-tactical opacity-20 pointer-events-none" />
        <div className="absolute inset-0 scanlines-thin opacity-20 pointer-events-none" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 border border-accent/60 bg-accent/15 px-3 py-1.5 font-mono-tech text-[10px] tracking-[0.2em] text-accent font-bold clip-tactical">
              <Gamepad2 className="size-3.5" aria-hidden />
              TACTICAL INTERFERENCE EVENT
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
              <span className="inline-block whitespace-nowrap">
                <span className="text-primary font-mono-tech">[</span> The
              </span>{" "}
              <span className="inline-block whitespace-nowrap">
                <span className="text-alert-gradient">Sabotage Quiz</span>{" "}
                <span className="text-primary font-mono-tech">]</span>
              </span>
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              Planning to bring chaos to the sprint? A high-speed, ECE-focused live quiz event runs
              during the build phase. Any squad can deploy one operative. The winning squad secures
              temporary electronic countermeasure cards to disrupt rival telemetry!
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3 border border-border/80 bg-card/60 p-3.5 clip-tactical">
                <Trophy className="size-5 shrink-0 text-accent mt-0.5" />
                <div>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-foreground uppercase">
                    Winner-Takes-All
                  </h4>
                  <p className="font-mono-tech text-[10px] text-muted-foreground mt-1">
                    Deploy an interference protocol against any squad of choice.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border border-border/80 bg-card/60 p-3.5 clip-tactical">
                <Users2 className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-foreground uppercase">
                    Open to All Squads
                  </h4>
                  <p className="font-mono-tech text-[10px] text-muted-foreground mt-1">
                    One operative per registered team can enlist in the quiz.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border/80 bg-card/40 p-3.5 font-mono-tech text-[10px] sm:text-xs tracking-wider text-muted-foreground flex gap-3 items-center clip-tactical">
              <AlertTriangle className="size-4 shrink-0 text-accent" aria-hidden />
              <span>
                Countermeasure actions are strictly monitored and executed in the presence of an
                event coordinator.
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-foreground flex items-center gap-2">
                <Radio className="size-4 text-accent" />
                Electronic Countermeasure Protocols
              </h3>
              <span className="font-mono-tech text-[9px] text-muted-foreground tracking-widest uppercase">
                4 CARDS IN CACHE
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {SABOTAGES.map((sabotage) => {
                const Icon = sabotage.icon;
                return (
                  <motion.div
                    key={sabotage.name}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div
                      className="panel-tactical p-4 flex flex-col justify-between h-full bg-card/85 border transition-all duration-300 ascii-corners"
                      style={{
                        borderColor: `color-mix(in oklab, ${sabotage.token} 40%, var(--border))`,
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase font-bold">
                            // {sabotage.code}
                          </span>
                          <span
                            className={`font-mono-tech text-[9px] tracking-widest px-2 py-0.5 border font-bold ${sabotage.badgeBg}`}
                          >
                            {sabotage.duration}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Icon className="size-4 shrink-0" style={{ color: sabotage.token }} />
                          <h4 className="font-display text-sm font-bold text-foreground">
                            {sabotage.name}
                          </h4>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {sabotage.effect}
                        </p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between font-mono-tech text-[8px] text-muted-foreground/60 tracking-wider">
                        <span>CLEARANCE // LEVEL 2</span>
                        <span style={{ color: sabotage.token }}>ARMED</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
