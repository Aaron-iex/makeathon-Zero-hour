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

const TRACK_COLORS = [
  { accent: "oklch(0.61 0.22 35)", glow: "rgba(224,76,17,0.25)", border: "rgba(224,76,17,0.5)" },
  { accent: "oklch(0.7 0.22 205)", glow: "rgba(56,182,255,0.25)", border: "rgba(56,182,255,0.5)" },
  { accent: "oklch(0.72 0.2 140)", glow: "rgba(74,222,128,0.25)", border: "rgba(74,222,128,0.5)" },
  { accent: "oklch(0.85 0.18 90)", glow: "rgba(234,179,8,0.25)", border: "rgba(234,179,8,0.5)" },
  { accent: "oklch(0.65 0.22 300)", glow: "rgba(168,85,247,0.25)", border: "rgba(168,85,247,0.5)" },
  { accent: "oklch(0.8 0.2 60)", glow: "rgba(255,200,0,0.35)", border: "rgba(255,200,0,0.6)" },
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
      {/* ── HIGHLY NOTICEABLE MANDATORY CORE DIRECTIVE BANNER ── */}
      <div className="relative mb-10 overflow-hidden border-2 border-primary bg-black/90 p-4 sm:p-6 shadow-[0_0_40px_rgba(224,76,17,0.35)] clip-tactical">
        <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 size-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center text-center gap-3">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] sm:text-xs tracking-[0.25em] text-primary font-black uppercase">
            <AlertTriangle className="size-4 animate-bounce text-primary" />
            CORE EVENT LOOP PROTOCOL // MANDATORY RULE
          </div>

          <div className="flex overflow-x-auto items-center justify-start sm:justify-center gap-2 sm:gap-4 font-display font-black text-base sm:text-2xl md:text-3xl uppercase text-foreground tracking-wide pb-2 w-full max-w-full scrollbar-none">
            <span className="shrink-0 px-2.5 py-1 bg-red-950/80 border border-red-500/60 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              CRISIS
            </span>
            <span className="shrink-0 text-primary font-mono-tech text-base sm:text-xl font-bold">
              →
            </span>
            <span className="shrink-0 px-2.5 py-1 bg-amber-950/80 border border-amber-500/60 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
              SENSE
            </span>
            <span className="shrink-0 text-primary font-mono-tech text-base sm:text-xl font-bold">
              →
            </span>
            <span className="shrink-0 px-2.5 py-1 bg-blue-950/80 border border-blue-500/60 text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              THINK
            </span>
            <span className="shrink-0 text-primary font-mono-tech text-base sm:text-xl font-bold">
              →
            </span>
            <span className="shrink-0 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              ADAPT
            </span>
            <span className="shrink-0 text-primary font-mono-tech text-base sm:text-xl font-bold">
              →
            </span>
            <span className="shrink-0 px-2.5 py-1 bg-accent/20 border border-accent text-accent drop-shadow-[0_0_15px_rgba(255,200,0,0.6)]">
              SURVIVE
            </span>
          </div>

          <p className="max-w-2xl font-mono-tech text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Every submission must demonstrate a physical sensor, real-time decision logic, and
            tangible hardware actuation.
          </p>
        </div>
      </div>

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-3xl"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block h-px w-8 bg-primary" />
          <span className="font-mono-tech text-[11px] tracking-[0.28em] text-primary uppercase font-bold">
            // STUDENT MAKEATHON CRISIS SECTORS
          </span>
        </div>
        <h2 className="font-display text-3xl font-black uppercase sm:text-5xl leading-tight">
          Choose Your Crisis:{" "}
          <span className="text-alert-gradient inline-block">Sense, Adapt & Survive</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Select a high-stakes engineering problem below. Click{" "}
          <strong className="text-primary">"View Crisis Details"</strong> to expand scenario
          specifications, hardware challenges, and implementation examples!
        </p>
      </motion.div>

      {/* ── OVERALL PRIZE CACHE (MOBILE-OPTIMIZED TACTICAL PODS) ── */}
      <div className="relative mt-8 overflow-hidden border-2 border-accent/60 bg-gradient-to-br from-black/95 via-card/95 to-black/95 p-5 sm:p-7 clip-tactical shadow-[0_0_35px_rgba(255,200,0,0.2)]">
        <div className="absolute inset-0 grid-tactical opacity-20 pointer-events-none" />

        {/* Banner Header */}
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-accent/30 pb-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center border border-accent bg-accent/20 text-accent clip-tactical shrink-0 shadow-[0_0_15px_rgba(255,200,0,0.4)]">
              <Trophy className="size-5 animate-pulse" aria-hidden />
            </div>
            <div>
              <span className="font-mono-tech text-[10px] sm:text-xs tracking-[0.25em] text-accent font-bold uppercase block">
                Planetary Defense Bounty
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-foreground">
                Overall Prize Cache: <span className="text-alert-gradient">₹22,000 INR</span>
              </h3>
            </div>
          </div>
          <span className="font-mono-tech text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest px-3 py-1 border border-border/80 bg-black/60">
            Open To All Departments & Colleges
          </span>
        </div>

        {/* 3 Prize Pods: 1st, 2nd, 3rd */}
        <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1st Prize */}
          <div className="panel-tactical p-4 sm:p-5 border-2 border-amber-400/80 bg-amber-950/25 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex flex-col justify-between text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 bg-amber-400 text-black font-mono-tech font-black text-[9px] px-2.5 py-0.5 tracking-wider uppercase">
              Champion
            </div>
            <div>
              <span className="font-mono-tech text-[10px] tracking-[0.2em] font-bold text-amber-400 uppercase">
                1ST PRIZE
              </span>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                ₹10,000
              </p>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-mono-tech text-amber-200/80 font-medium">
              + Winner Trophy, Merch & Certificates
            </p>
          </div>

          {/* 2nd Prize */}
          <div className="panel-tactical p-4 sm:p-5 border border-sky-400/70 bg-sky-950/20 shadow-[0_0_15px_rgba(56,182,255,0.2)] flex flex-col justify-between text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 bg-sky-400 text-black font-mono-tech font-black text-[9px] px-2.5 py-0.5 tracking-wider uppercase">
              Runner-up
            </div>
            <div>
              <span className="font-mono-tech text-[10px] tracking-[0.2em] font-bold text-sky-400 uppercase">
                2ND PRIZE
              </span>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl lg:text-4xl font-black text-sky-300 drop-shadow-[0_0_15px_rgba(56,182,255,0.4)]">
                ₹7,000
              </p>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-mono-tech text-sky-200/80 font-medium">
              + Excellence Shield & Certificates
            </p>
          </div>

          {/* 3rd Prize */}
          <div className="panel-tactical p-4 sm:p-5 border border-orange-400/70 bg-orange-950/20 shadow-[0_0_15px_rgba(249,115,22,0.2)] flex flex-col justify-between text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 bg-orange-400 text-black font-mono-tech font-black text-[9px] px-2.5 py-0.5 tracking-wider uppercase">
              2nd Runner-up
            </div>
            <div>
              <span className="font-mono-tech text-[10px] tracking-[0.2em] font-bold text-orange-400 uppercase">
                3RD PRIZE
              </span>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl lg:text-4xl font-black text-orange-300 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                ₹5,000
              </p>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-mono-tech text-orange-200/80 font-medium">
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
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {TRACKS.map((track, idx) => {
          const Icon = ICONS[track.icon];
          const color = TRACK_COLORS[idx % TRACK_COLORS.length]!;
          const isFeatured = track.featured;

          return (
            <motion.article
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 200, damping: 20 },
                },
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              key={track.id}
              className={`panel-tactical relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300
                          hover:-translate-y-1.5 group cursor-pointer bg-black/90 ascii-corners group-hover:shadow-[inset_0_0_24px_var(--track-glow)] ${
                            isFeatured
                              ? "border-2 border-accent/70 shadow-[0_0_25px_rgba(255,200,0,0.25)]"
                              : "border border-border/90 hover:border-primary/60"
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
                    className="grid size-10 place-items-center border clip-tactical transition-transform duration-300 group-hover:scale-110 shrink-0"
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
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
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
                      <h4 className="font-mono-tech text-xs tracking-[0.2em] text-emerald-400 uppercase font-bold mb-3 flex items-center gap-2">
                        <Lightbulb className="size-4 text-emerald-400" />
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
                      <div className="border border-amber-500/50 bg-amber-950/20 p-4">
                        <h4 className="font-mono-tech text-xs tracking-[0.2em] text-amber-400 uppercase font-bold mb-1 flex items-center gap-2">
                          <ShieldCheck className="size-4 text-amber-400" />
                          HARDWARE CONSTRAINT
                        </h4>
                        <p className="text-xs sm:text-sm text-amber-200/90">
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
