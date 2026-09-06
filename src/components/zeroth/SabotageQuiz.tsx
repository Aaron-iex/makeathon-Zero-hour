import {
  Gamepad2,
  ShieldAlert,
  Trophy,
  WifiOff,
  Keyboard,
  Users2,
  Sparkles,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const SABOTAGES = [
  {
    name: "EMP Wi-Fi Jammer",
    duration: "5 Mins",
    effect: "Target team's internet connection is suspended. They must rely on offline knowledge.",
    icon: WifiOff,
    color: "text-red-500 border-red-500/30 bg-red-500/10",
  },
  {
    name: "Keyboard Lockout",
    duration: "5 Mins",
    effect: "Target team's lead coder must code using only a touch keyboard or with one hand.",
    icon: Keyboard,
    color: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  },
  {
    name: "Telemetry Jam",
    duration: "10 Mins",
    effect: "Restricts target team's communication and access to Faculty/Student mentors.",
    icon: EyeOff,
    color: "text-blue-500 border-blue-500/30 bg-blue-500/10",
  },
  {
    name: "Noise Injection",
    duration: "5 Mins",
    effect:
      "Target team must wear headphones playing heavy static noise to test focus under pressure.",
    icon: ShieldAlert,
    color: "text-purple-500 border-purple-500/30 bg-purple-500/10",
  },
];

export function SabotageQuiz() {
  return (
    <section id="sabotage-quiz" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="panel-tactical p-6 sm:p-10 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-24 -top-24 size-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 size-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/12 px-3 py-1.5 font-mono-tech text-[10px] tracking-[0.2em] text-accent clip-tactical">
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

            <p className="text-base leading-relaxed text-muted-foreground">
              Planning to bring some chaos to the sprint? We're introducing a high-speed,
              ECE-focused live quiz event. Any interested squad can deploy one operative to
              participate. The winner secures temporary interference cards to sabotage competing
              teams!
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <Trophy className="size-5 shrink-0 text-accent mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    Winner-Takes-All
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deploy a sabotage action to any team of choice.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users2 className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    Open to All Teams
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    One representative from any squad can enlist.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border/60 bg-background/50 p-4 font-mono-tech text-xs tracking-wider text-muted-foreground flex gap-3 items-center">
              <AlertTriangle className="size-4 shrink-0 text-accent animate-pulse" aria-hidden />
              <span>
                Sabotage actions are designed for fun and must be executed in the presence of an
                event coordinator.
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-[0.12em] text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              Available Sabotage Protocols
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {SABOTAGES.map((sabotage) => {
                const Icon = sabotage.icon;
                return (
                  <motion.div
                    key={sabotage.name}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card
                      className={`border p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${sabotage.color} h-full`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <Icon className="size-5" />
                          <span className="font-mono-tech text-[10px] tracking-wider px-2 py-0.5 border border-current rounded-full">
                            {sabotage.duration}
                          </span>
                        </div>
                        <h4 className="mt-3 font-display text-sm font-bold text-foreground">
                          {sabotage.name}
                        </h4>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {sabotage.effect}
                        </p>
                      </div>
                    </Card>
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
