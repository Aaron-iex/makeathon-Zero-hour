import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Flame, MapPin, Radio, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIMELINE, type Stage } from "@/data/zeroth";
import { loadState, saveState, STORAGE_KEYS } from "@/lib/state-persistence";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const FILTERS: { id: Stage | "all"; label: string; icon: typeof Clock }[] = [
  { id: "all", label: "All phases", icon: Radio },
  { id: "prep", label: "Reporting · 08:00", icon: Clock },
  { id: "hacking", label: "Sprint · 11:00", icon: Zap },
  { id: "pitch", label: "Awards · 04:00", icon: Flame },
];

const STAGE_COLORS: Record<string, { dot: string; glow: string; border: string }> = {
  prep: {
    dot: "bg-[var(--radar-cyan)]",
    glow: "shadow-[0_0_8px_rgba(56,182,255,0.4)]",
    border: "border-[var(--radar-cyan)]/50",
  },
  hacking: {
    dot: "bg-primary",
    glow: "shadow-[0_0_8px_rgba(224,76,17,0.4)]",
    border: "border-primary/50",
  },
  pitch: {
    dot: "bg-accent",
    glow: "shadow-[0_0_8px_rgba(234,179,8,0.4)]",
    border: "border-accent/50",
  },
};

export function Roadmap({
  onRegister,
  preview,
  onExpand,
}: {
  onRegister: () => void;
  preview?: boolean;
  onExpand?: () => void;
}) {
  const [active, setActiveRaw] = useState<Stage | "all">(() =>
    loadState<Stage | "all">(STORAGE_KEYS.ROADMAP_FILTER, "all"),
  );

  const containerRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const items = containerRef.current?.querySelectorAll(".timeline-item");
      if (!items?.length) return;
      gsap.fromTo(
        items,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    },
    { scope: containerRef },
  );

  const setActive = useCallback((stage: Stage | "all") => {
    setActiveRaw(stage);
    saveState(STORAGE_KEYS.ROADMAP_FILTER, stage);
  }, []);

  const events = active === "all" ? TIMELINE : TIMELINE.filter((e) => e.stage === active);
  const previewEvents = TIMELINE.slice(0, 3);
  const displayEvents = preview ? previewEvents : events;

  return (
    <section id="roadmap" className="border-y border-border bg-card/40 relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 grid-tactical opacity-20 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-px w-6 bg-primary" />
            <span className="font-mono-tech text-[11px] tracking-[0.28em] text-primary uppercase font-bold">
              // MAKEATHON SCHEDULE
            </span>
            <span className="h-px w-6 bg-primary" />
          </div>
          <h2 className="font-display text-2xl font-black uppercase sm:text-4xl md:text-5xl">
            Event <span className="text-alert-gradient">Schedule & Roadmap</span>
          </h2>
          <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2.5 border border-accent/50 bg-accent/12 px-5 py-2.5 clip-tactical">
            <MapPin className="size-4 text-accent shrink-0" />
            <span className="font-mono-tech text-[10px] sm:text-[11px] tracking-[0.18em] text-accent font-bold uppercase">
              JAYA AUDITORIUM | SEPT 23 · 5-HR MAKEATHON
            </span>
          </div>
        </div>

        {/* Stage Filters (not in preview mode) */}
        {!preview && (
          <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`group flex items-center gap-2 px-4 py-2.5 min-h-[44px] clip-tactical font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.18em] transition-all duration-300 touch-manipulation ${
                  active === f.id
                    ? "bg-accent text-accent-foreground shadow-[var(--glow-warn)]"
                    : "border border-border bg-card text-muted-foreground hover:text-accent hover:border-accent/40"
                }`}
              >
                <f.icon
                  className={`size-3.5 transition-transform ${active === f.id ? "animate-pulse" : ""}`}
                />
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Timeline */}
        <ol
          ref={containerRef}
          className={`relative ${preview ? "mt-10" : "mt-12"} ml-3 sm:ml-8 space-y-5 sm:space-y-6`}
        >
          {/* Vertical connecting line */}
          <div className="absolute left-0 sm:left-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-primary/20" />

          {displayEvents.map((evt, idx) => {
            const colors = STAGE_COLORS[evt.stage] || STAGE_COLORS["hacking"]!;
            return (
              <li key={evt.title} className="timeline-item group relative pl-8 sm:pl-12">
                {/* Timeline dot */}
                <div
                  className={`absolute left-[-7px] sm:left-[-8px] top-5 size-4 rounded-full ${colors.dot} ${colors.glow}
                                ring-2 ring-background flex items-center justify-center z-10`}
                >
                  <div className="size-1.5 rounded-full bg-card" />
                </div>

                {/* Event Card */}
                <div
                  className={`panel-tactical p-4 sm:p-6 transition-all duration-300 relative overflow-hidden
                                group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-panel)]
                                border-l-2 ${colors.border}`}
                >
                  {/* Vertical progress indicator bar on right edge */}
                  <div
                    className="absolute top-0 bottom-0 right-0 w-1 bg-white/5 flex flex-col justify-end pointer-events-none"
                    aria-hidden
                  >
                    <div
                      className="w-full bg-gradient-to-t from-primary to-accent transition-all duration-500 opacity-60 group-hover:opacity-100"
                      style={{ height: `${Math.min(100, Math.max(25, (idx + 1) * 15))}%` }}
                    />
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span
                      className="font-mono-tech text-primary/60 select-none hidden sm:inline"
                      aria-hidden
                    >
                      ┃
                    </span>
                    <span className="border border-primary/50 bg-primary/12 px-2.5 py-0.5 font-mono-tech text-[9px] sm:text-[10px] tracking-[0.18em] text-primary font-bold">
                      {evt.phase}
                    </span>
                    <span className="flex items-center gap-1 font-mono-tech text-[10px] sm:text-[11px] text-accent font-bold">
                      <Clock className="size-3.5" aria-hidden />
                      {evt.time}
                    </span>
                    <span className="ml-auto flex items-center gap-1 font-mono-tech text-[9px] sm:text-[10px] text-muted-foreground">
                      <MapPin className="size-3" aria-hidden />
                      {evt.location}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 font-display text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                    {evt.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {evt.description}
                  </p>

                  {/* Status bar */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="font-mono-tech text-[9px] sm:text-[10px] tracking-[0.2em] text-accent font-bold">
                      STATUS: {evt.status}
                    </span>
                    <div className="h-px flex-1 mx-3 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <span className="font-mono-tech text-[9px] text-primary">
                      STAGE / {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Preview expand button */}
        {preview && (
          <div className="mt-8 sm:mt-10 text-center">
            <Button
              variant="tactical"
              size="xl"
              onClick={onExpand}
              className="group min-h-[44px] hover:shadow-[0_0_20px_rgba(255,200,0,0.25)] transition-shadow"
            >
              <ChevronRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
              View full build schedule
            </Button>
          </div>
        )}

        {/* CTA Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mt-10 sm:mt-14 overflow-hidden"
        >
          <div className="absolute inset-0 grid-tactical opacity-15 pointer-events-none" />
          <div className="panel-tactical relative space-y-4 p-6 sm:p-8 text-center border border-primary/30">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 size-5 border-t-2 border-l-2 border-primary/50" />
            <div className="absolute -top-1 -right-1 size-5 border-t-2 border-r-2 border-primary/50" />
            <div className="absolute -bottom-1 -left-1 size-5 border-b-2 border-l-2 border-accent/50" />
            <div className="absolute -bottom-1 -right-1 size-5 border-b-2 border-r-2 border-accent/50" />

            <h3 className="font-display text-xl sm:text-2xl font-black uppercase">
              Ready to build your <span className="text-alert-gradient">survival tech</span>?
            </h3>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted-foreground">
              ₹200 per squad. Open to students, researchers, and builders. Secure your clearance
              badge before squad lockdown.
            </p>
            <Button
              variant="alert"
              size="xl"
              onClick={onRegister}
              className="group min-h-[44px] hover:shadow-[0_0_30px_rgba(224,76,17,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Flame className="size-4" aria-hidden />
              Secure squad clearance
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
