import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Anchor,
  Flame,
  Rocket,
  Waves,
  Zap,
  type LucideIcon,
  ChevronRight,
  Trophy,
  X,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Activity,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRACKS, type Track } from "@/data/zeroth";
import { motion } from "framer-motion";

const ICONS = {
  waves: Waves,
  flame: Flame,
  rocket: Rocket,
  anchor: Anchor,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

// Disciplined tactical telemetry tokens: Alert Red, Radar Cyan, Warning Amber
const TRACK_COLORS = [
  {
    accent: "var(--primary)",
    glow: "rgba(224,76,17,0.2)",
    border: "color-mix(in oklab, var(--primary) 50%, transparent)",
  },
  {
    accent: "var(--radar-cyan)",
    glow: "rgba(56,182,255,0.2)",
    border: "color-mix(in oklab, var(--radar-cyan) 50%, transparent)",
  },
  {
    accent: "var(--accent)",
    glow: "rgba(234,179,8,0.2)",
    border: "color-mix(in oklab, var(--accent) 50%, transparent)",
  },
  {
    accent: "var(--primary)",
    glow: "rgba(224,76,17,0.2)",
    border: "color-mix(in oklab, var(--primary) 50%, transparent)",
  },
  {
    accent: "var(--accent)",
    glow: "rgba(234,179,8,0.2)",
    border: "color-mix(in oklab, var(--accent) 50%, transparent)",
  },
  {
    accent: "var(--radar-cyan)",
    glow: "rgba(56,182,255,0.2)",
    border: "color-mix(in oklab, var(--radar-cyan) 50%, transparent)",
  },
];

export function Sectors({ onRegister }: { onRegister: (track: string) => void }) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Open Track with URL Hash for Mobile Back Button Safety ── */
  const handleSelectTrack = useCallback((track: Track) => {
    if (typeof window !== "undefined") {
      scrollPositionRef.current = window.scrollY;
    }
    setSelectedTrack(track);
    if (typeof window !== "undefined" && !window.location.hash.startsWith("#crisis-")) {
      window.history.pushState({ modal: `crisis-${track.id}` }, "", `#crisis-${track.id}`);
    }
  }, []);

  /* ── Close Track Modal (Syncs with Browser History & Preserves Scroll) ── */
  const handleCloseModal = useCallback(() => {
    setSelectedTrack(null);
    const prevScroll = scrollPositionRef.current;
    if (typeof window !== "undefined" && window.location.hash.startsWith("#crisis-")) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    if (typeof window !== "undefined" && prevScroll > 0) {
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - prevScroll) > 50) {
          window.scrollTo({ top: prevScroll, behavior: "instant" as ScrollBehavior });
        }
      });
    }
  }, []);

  /* ── Popstate Listener: Close modal on mobile back button without reloading ── */
  useEffect(() => {
    // Check initial hash on mount
    if (typeof window !== "undefined" && window.location.hash.startsWith("#crisis-")) {
      const crisisId = window.location.hash.replace("#crisis-", "");
      const matched = TRACKS.find((t) => t.id === crisisId);
      if (matched) setSelectedTrack(matched);
    }

    const onPopState = () => {
      if (!window.location.hash.startsWith("#crisis-")) {
        setSelectedTrack(null);
        const prevScroll = scrollPositionRef.current;
        if (typeof window !== "undefined" && prevScroll > 0) {
          requestAnimationFrame(() => {
            if (Math.abs(window.scrollY - prevScroll) > 50) {
              window.scrollTo({ top: prevScroll, behavior: "instant" as ScrollBehavior });
            }
          });
        }
      } else {
        // If navigated forward to a crisis hash
        const crisisId = window.location.hash.replace("#crisis-", "");
        const matched = TRACKS.find((t) => t.id === crisisId);
        if (matched) setSelectedTrack(matched);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /* ── Modal Accessibility: Focus Trapping, Body Lock & Escape Key Handler ── */
  useEffect(() => {
    if (!selectedTrack) return;

    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedTrack, handleCloseModal]);

  return (
    <section id="sectors" className="mx-auto max-w-7xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
      {/* ── HIGH-PRECISION CORE DIRECTIVE TELEMETRY PIPELINE ── */}
      <div className="relative mb-10 overflow-hidden border border-primary/50 bg-card/90 p-4 sm:p-6 clip-tactical shadow-[0_0_30px_rgba(224,76,17,0.2)]">
        <div className="absolute inset-0 scanlines-thin opacity-30 pointer-events-none" />
        <div className="absolute inset-0 grid-tactical opacity-20 pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center text-center gap-3">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] sm:text-xs tracking-[0.25em] text-primary font-bold uppercase">
            <AlertTriangle className="size-3.5 text-primary" />
            CORE EVENT LOOP // MANDATORY ARCHITECTURE PROTOCOL
          </div>

          <div className="flex overflow-x-auto items-center justify-start sm:justify-center gap-1.5 sm:gap-2.5 font-display text-sm sm:text-base uppercase tracking-wider pb-1 w-full max-w-full scrollbar-none">
            {/* Step 1: CRISIS */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="border border-primary/60 bg-primary/10 px-3 py-1.5 text-left">
                <span className="block font-mono-tech text-[8px] sm:text-[9px] text-primary/80 tracking-widest">
                  01 // DETECT
                </span>
                <span className="font-display font-black text-foreground text-xs sm:text-sm">
                  CRISIS
                </span>
              </div>
              <span className="text-primary/60 font-mono-tech text-xs sm:text-sm font-bold select-none">
                ──▶
              </span>
            </div>

            {/* Step 2: SENSE */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="border border-border/80 bg-card/80 px-3 py-1.5 text-left">
                <span className="block font-mono-tech text-[8px] sm:text-[9px] text-muted-foreground tracking-widest">
                  02 // ACQUIRE
                </span>
                <span className="font-display font-black text-foreground text-xs sm:text-sm">
                  SENSE
                </span>
              </div>
              <span className="text-muted-foreground/60 font-mono-tech text-xs sm:text-sm font-bold select-none">
                ──▶
              </span>
            </div>

            {/* Step 3: THINK */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="border border-border/80 bg-card/80 px-3 py-1.5 text-left">
                <span className="block font-mono-tech text-[8px] sm:text-[9px] text-muted-foreground tracking-widest">
                  03 // COMPUTE
                </span>
                <span className="font-display font-black text-foreground text-xs sm:text-sm">
                  THINK
                </span>
              </div>
              <span className="text-muted-foreground/60 font-mono-tech text-xs sm:text-sm font-bold select-none">
                ──▶
              </span>
            </div>

            {/* Step 4: ADAPT */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="border border-border/80 bg-card/80 px-3 py-1.5 text-left">
                <span className="block font-mono-tech text-[8px] sm:text-[9px] text-muted-foreground tracking-widest">
                  04 // ACTUATE
                </span>
                <span className="font-display font-black text-foreground text-xs sm:text-sm">
                  ADAPT
                </span>
              </div>
              <span className="text-accent/80 font-mono-tech text-xs sm:text-sm font-bold select-none">
                ──▶
              </span>
            </div>

            {/* Step 5: SURVIVE */}
            <div className="shrink-0 border border-accent/80 bg-accent/15 px-3.5 py-1.5 text-left relative">
              <span className="block font-mono-tech text-[8px] sm:text-[9px] text-accent font-bold tracking-widest">
                05 // OBJECTIVE
              </span>
              <span className="font-display font-black text-accent text-xs sm:text-sm">
                SURVIVE
              </span>
            </div>
          </div>

          <p className="max-w-2xl font-mono-tech text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
            Every submission must demonstrate a physical sensor, real-time decision logic, and
            tangible hardware actuation.
          </p>
        </div>
      </div>

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-3xl"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block h-px w-8 bg-primary" />
          <span className="font-mono-tech text-[11px] tracking-[0.28em] text-primary uppercase font-bold">
            // STUDENT MAKEATHON CRISIS SECTORS
          </span>
        </div>
        <h2 className="font-display text-[clamp(1.75rem,5vw,3rem)] font-black uppercase leading-tight">
          Choose Your Crisis:{" "}
          <span className="text-alert-gradient inline-block">Sense, Adapt & Survive</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Select a high-stakes engineering problem below. Click{" "}
          <strong className="text-primary">"View Crisis Details"</strong> to expand scenario
          specifications, hardware challenges, and implementation examples!
        </p>
      </motion.div>

      {/* ── OVERALL PRIZE CACHE (TACTICAL BOUNTY PODIUM) ── */}
      <div className="relative mt-8 overflow-hidden border border-accent/60 bg-card/90 p-4 sm:p-7 clip-tactical shadow-[0_0_30px_rgba(255,200,0,0.1)]">
        <div className="absolute inset-0 grid-tactical opacity-20 pointer-events-none" />

        {/* Banner Header */}
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-accent/25 pb-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center border border-accent/80 bg-accent/15 text-accent clip-tactical shrink-0">
              <Trophy className="size-5" aria-hidden />
            </div>
            <div>
              <span className="font-mono-tech text-[9px] sm:text-[10px] tracking-[0.25em] text-accent font-bold uppercase block">
                Planetary Defense Bounty
              </span>
              <h3 className="font-display text-lg sm:text-2xl font-black uppercase text-foreground">
                Overall Prize Cache: <span className="text-alert-gradient">₹22,000 INR</span>
              </h3>
            </div>
          </div>
          <span className="font-mono-tech text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest px-3 py-1 border border-border bg-card/80">
            Open To All Departments & Colleges
          </span>
        </div>

        {/* 3 Prize Pods: 1st (Warning Amber), 2nd (Alert Red), 3rd (Radar Cyan) */}
        <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 1st Prize */}
          <div className="panel-tactical p-4 sm:p-5 border border-accent/70 bg-accent/10 flex flex-col justify-between text-center relative overflow-hidden transition-colors hover:border-accent ascii-corners">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground font-mono-tech font-black text-[9px] px-2 py-0.5 tracking-wider uppercase">
              RANK 01 // CHAMPION
            </div>
            <div className="pt-2">
              <span className="font-mono-tech text-[9px] tracking-[0.2em] font-bold text-accent uppercase">
                1ST PRIZE
              </span>
              <p className="mt-1 font-display text-2xl sm:text-3xl lg:text-4xl font-black text-accent tabular-nums">
                ₹10,000
              </p>
            </div>
            <p className="mt-2 text-[10px] sm:text-[11px] font-mono-tech text-muted-foreground font-medium">
              + Winner Trophy, Merch & Certificates
            </p>
          </div>

          {/* 2nd Prize */}
          <div className="panel-tactical p-4 sm:p-5 border border-primary/70 bg-primary/10 flex flex-col justify-between text-center relative overflow-hidden transition-colors hover:border-primary ascii-corners">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono-tech font-black text-[9px] px-2 py-0.5 tracking-wider uppercase">
              RANK 02 // RUNNER-UP
            </div>
            <div className="pt-2">
              <span className="font-mono-tech text-[9px] tracking-[0.2em] font-bold text-primary uppercase">
                2ND PRIZE
              </span>
              <p className="mt-1 font-display text-2xl sm:text-3xl lg:text-4xl font-black text-primary tabular-nums">
                ₹7,000
              </p>
            </div>
            <p className="mt-2 text-[10px] sm:text-[11px] font-mono-tech text-muted-foreground font-medium">
              + Excellence Shield & Certificates
            </p>
          </div>

          {/* 3rd Prize */}
          <div
            className="panel-tactical p-4 sm:p-5 border flex flex-col justify-between text-center relative overflow-hidden transition-colors ascii-corners"
            style={{
              borderColor: "color-mix(in oklab, var(--radar-cyan) 65%, transparent)",
              backgroundColor: "color-mix(in oklab, var(--radar-cyan) 8%, transparent)",
            }}
          >
            <div
              className="absolute top-0 right-0 font-mono-tech font-black text-[9px] px-2 py-0.5 tracking-wider uppercase text-black"
              style={{ backgroundColor: "var(--radar-cyan)" }}
            >
              RANK 03 // 2ND RUNNER-UP
            </div>
            <div className="pt-2">
              <span
                className="font-mono-tech text-[9px] tracking-[0.2em] font-bold uppercase"
                style={{ color: "var(--radar-cyan)" }}
              >
                3RD PRIZE
              </span>
              <p
                className="mt-1 font-display text-2xl sm:text-3xl lg:text-4xl font-black tabular-nums"
                style={{ color: "var(--radar-cyan)" }}
              >
                ₹5,000
              </p>
            </div>
            <p className="mt-2 text-[10px] sm:text-[11px] font-mono-tech text-muted-foreground font-medium">
              + Merit Shield & Certificates
            </p>
          </div>
        </div>
      </div>

      {/* Track Cards */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {TRACKS.map((track, idx) => {
          const Icon = ICONS[track.icon];
          const color = TRACK_COLORS[idx % TRACK_COLORS.length]!;
          const isFeatured = track.featured;

          return (
            <motion.article
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              key={track.id}
              className={`panel-tactical relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-200
                          group cursor-pointer bg-card/90 ascii-corners ${
                            isFeatured
                              ? "border-2 border-accent/70 shadow-[0_0_20px_rgba(255,200,0,0.15)]"
                              : "border border-border/80 hover:border-primary/60"
                          }`}
              style={
                {
                  "--track-accent": color.accent,
                  "--track-glow": color.glow,
                } as React.CSSProperties
              }
              onClick={() => handleSelectTrack(track)}
            >
              {/* Subtle background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${color.glow} 0%, transparent 70%)`,
                }}
              />

              {/* Card top row */}
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="grid size-10 place-items-center border clip-tactical shrink-0"
                    style={{
                      borderColor: color.border,
                      backgroundColor: `color-mix(in oklab, ${color.accent} 15%, transparent)`,
                    }}
                  >
                    <Icon className="size-5" style={{ color: color.accent }} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono-tech text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground block">
                      {track.code}
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-black uppercase text-foreground group-hover:text-accent transition-colors truncate">
                      {track.title}
                    </h3>
                  </div>
                </div>

                {isFeatured && (
                  <span className="shrink-0 border border-accent/60 bg-accent/20 px-2 py-0.5 font-mono-tech text-[9px] font-bold tracking-widest text-accent clip-tactical">
                    FEATURED
                  </span>
                )}
              </div>

              {/* Threat badge */}
              <div className="relative mt-3">
                <span
                  className="inline-block font-mono-tech text-[9px] tracking-[0.22em] uppercase font-bold px-2 py-0.5 border"
                  style={{
                    color: color.accent,
                    borderColor: `color-mix(in oklab, ${color.accent} 40%, transparent)`,
                    backgroundColor: `color-mix(in oklab, ${color.accent} 10%, transparent)`,
                  }}
                >
                  [ {track.threat} ]
                </span>
              </div>

              {/* Brief */}
              <p className="relative mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                {track.brief}
              </p>

              {/* Actions row: Ultra-Clear, High-Visibility Buttons */}
              <div
                className="relative mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t pt-4 transition-colors duration-300"
                style={{ borderColor: `color-mix(in oklab, ${color.border} 40%, var(--border))` }}
              >
                {/* View Details Button (Highly Noticeable Styled Button) */}
                <Button
                  variant="tactical"
                  size="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack(track);
                  }}
                  className="w-full sm:w-auto flex-1 min-h-[44px] px-3.5 font-mono-tech text-xs tracking-[0.14em] font-bold text-primary border-2 border-primary/70 bg-primary/15 hover:bg-primary hover:text-white shadow-[0_0_15px_rgba(224,76,17,0.25)] transition-all touch-manipulation group/btn"
                  aria-label={`View crisis details for ${track.title}`}
                >
                  <Activity className="size-4 shrink-0 text-primary group-hover/btn:text-white transition-colors" />
                  <span>View Details</span>
                </Button>

                {/* Register Button */}
                <Button
                  variant="alert"
                  size="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegister(track.title);
                  }}
                  className="w-full sm:w-auto flex-1 min-h-[44px] px-3.5 font-mono-tech text-xs tracking-[0.14em] font-bold touch-manipulation"
                  aria-label={`Register for ${track.title}`}
                >
                  <span>Register</span>
                  <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>

              {/* Protocol ID telemetry stamp */}
              <div className="relative mt-2.5 flex items-center justify-between font-mono-tech text-[8px] sm:text-[9px] text-muted-foreground/70 tracking-[0.2em] uppercase border-t border-border/40 pt-1.5">
                <span>PRTCL // {track.code}</span>
                <span className="text-primary/70">SEC-CLEARANCE // L1</span>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {/* ── EXPANDABLE CRISIS DETAIL MODAL (PORTALED TO BODY) ── */}
      {mounted &&
        selectedTrack &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crisis-detail-title"
            onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
          >
            <div
              className="h-full w-full overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch p-2.5 sm:p-6 pb-[env(safe-area-inset-bottom,24px)]"
              onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
            >
              <div className="flex min-h-full items-start sm:items-center justify-center py-2 sm:py-6">
                <div
                  ref={modalRef}
                  className="relative w-full max-w-3xl my-auto bg-background border-2 border-primary p-4 sm:p-8 clip-tactical shadow-[0_0_50px_rgba(224,76,17,0.4)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    ref={closeBtnRef}
                    onClick={handleCloseModal}
                    aria-label="Close details modal"
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary transition-colors touch-manipulation cursor-pointer z-10 clip-tactical"
                  >
                    <X className="size-5" />
                  </button>

                  {/* Header Badge */}
                  <div className="flex items-center gap-3 mb-2 pr-12">
                    <span className="font-mono-tech text-xs tracking-[0.2em] font-bold text-primary px-2.5 py-0.5 border border-primary/40 bg-primary/10">
                      {selectedTrack.code}
                    </span>
                    <span className="font-mono-tech text-xs text-muted-foreground uppercase font-bold tracking-widest truncate">
                      {selectedTrack.crisisName}
                    </span>
                  </div>

                  <h2
                    id="crisis-detail-title"
                    className="font-display text-2xl sm:text-4xl font-black uppercase text-foreground pr-10"
                  >
                    {selectedTrack.title}
                  </h2>

                  <div className="mt-6 space-y-6">
                    {/* Scenario */}
                    <div className="border-l-2 border-primary/80 pl-4 py-2 bg-primary/5">
                      <h4 className="font-mono-tech text-xs tracking-[0.2em] text-primary uppercase font-bold mb-1 flex items-center gap-2">
                        <AlertTriangle className="size-4 text-primary" />
                        SCENARIO BRIEFING
                      </h4>
                      <p className="text-sm sm:text-base text-foreground leading-relaxed italic">
                        "{selectedTrack.scenario}"
                      </p>
                    </div>

                    {/* Engineering Problem */}
                    <div className="border border-border bg-card/40 p-4">
                      <h4 className="font-mono-tech text-xs tracking-[0.2em] text-accent uppercase font-bold mb-2 flex items-center gap-2">
                        <Cpu className="size-4 text-accent" />
                        ENGINEERING PROBLEM
                      </h4>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-semibold">
                        {selectedTrack.engineeringProblem}
                      </p>
                    </div>

                    {/* Example Ideas */}
                    <div>
                      <h4 className="font-mono-tech text-xs tracking-[0.2em] text-radar-cyan uppercase font-bold mb-3 flex items-center gap-2">
                        <Lightbulb className="size-4 text-radar-cyan" />
                        EXAMPLE IMPLEMENTATION CONCEPTS
                      </h4>
                      <ul className="grid gap-2">
                        {selectedTrack.exampleIdeas.map((idea, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-foreground bg-muted/20 border border-muted/30 p-3"
                          >
                            <span className="font-mono-tech text-xs font-bold text-primary shrink-0 mt-0.5">
                              0{i + 1}.
                            </span>
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Mandatory Constraint (if any) */}
                    {selectedTrack.constraint && (
                      <div className="border border-accent/50 bg-accent/10 p-4">
                        <h4 className="font-mono-tech text-xs tracking-[0.2em] text-accent uppercase font-bold mb-1 flex items-center gap-2">
                          <ShieldCheck className="size-4 text-accent" />
                          HARDWARE CONSTRAINT
                        </h4>
                        <p className="text-xs sm:text-sm text-accent/90">
                          {selectedTrack.constraint}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons inside modal */}
                  <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button
                      variant="tactical"
                      onClick={handleCloseModal}
                      className="w-full sm:w-auto min-h-[44px] font-mono-tech text-xs tracking-wider cursor-pointer"
                    >
                      ← RETURN TO CRISIS LIST
                    </Button>

                    <Button
                      variant="alert"
                      onClick={() => {
                        const title = selectedTrack.title;
                        handleCloseModal();
                        onRegister(title);
                      }}
                      className="w-full sm:w-auto min-h-[44px] font-bold tracking-wider cursor-pointer"
                    >
                      REGISTER FOR THIS CRISIS →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
