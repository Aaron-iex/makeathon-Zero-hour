import { useEffect, useRef, useState, useCallback } from "react";
import {
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Crosshair,
  Radio,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cataclysm.jpg";
import { browserCompat } from "@/lib/browser-compat";
import { loadState, saveState, STORAGE_KEYS } from "@/lib/state-persistence";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// openmotion.design inspired transitions
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const fadeUpBlur = {
  hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

/* ─── Cinematic Opening Sequence (Mobile & Desktop Responsive) ─── */
const DISASTER_SEQUENCE = [
  { text: "⚠ SEISMIC BREACH DETECTED", color: "text-red-500" },
  { text: "◈ CORE MELTDOWN IMMINENT", color: "text-orange-400" },
  { text: "◉ RF BLACKOUT — ALL BANDS", color: "text-yellow-400" },
  { text: "△ GLOBAL COMMS FAILURE", color: "text-red-400" },
  { text: "▣ INITIATING ZEROTH HOUR PROTOCOL", color: "text-primary font-bold" },
];

function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0-4 = disaster lines, 5 = fade out
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (phase < DISASTER_SEQUENCE.length) {
      const id = setTimeout(() => setPhase((p) => p + 1), 600);
      return () => clearTimeout(id);
    } else {
      setOpacity(0);
      const id = setTimeout(onComplete, 700);
      return () => clearTimeout(id);
    }
  }, [phase, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md px-3 py-6 pointer-events-none transition-opacity duration-700 overflow-hidden"
      style={{ opacity }}
    >
      {/* Scanline & Grid Overlays */}
      <div className="absolute inset-0 scanlines opacity-60 pointer-events-none" />
      <div className="absolute inset-0 grid-tactical opacity-15 pointer-events-none" />

      {/* Central Warning Icon */}
      <div className="relative mb-4 sm:mb-6 shrink-0">
        <AlertTriangle className="size-10 sm:size-14 text-primary animate-pulse" />
        <div className="absolute inset-0 animate-ping">
          <AlertTriangle className="size-10 sm:size-14 text-primary opacity-30" />
        </div>
      </div>

      {/* Responsive Disaster Sequence Lines */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-[92vw] sm:max-w-xl text-center">
        {DISASTER_SEQUENCE.map((item, i) => (
          <div
            key={i}
            className={`font-mono-tech text-[11px] sm:text-xs md:text-sm tracking-[0.12em] sm:tracking-[0.2em] uppercase transition-all duration-300 ${
              i < phase ? `${item.color} opacity-100 translate-y-0` : "opacity-0 translate-y-3"
            }`}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Bottom Pulse Bar */}
      {phase >= 3 && <div className="absolute bottom-0 inset-x-0 h-1 bg-primary animate-pulse" />}
    </div>
  );
}

/* ─── Floating Ember Particle Canvas ─── */
function EmberCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!browserCompat.supportsCanvas() || browserCompat.prefersReducedMotion()) {
      return;
    }

    let rafId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      hue: number;
    };

    const isMobile = canvas.width < 640;
    const isVerySmall = canvas.width < 375;
    const count = isVerySmall ? 10 : isMobile ? 16 : 40;

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.6 + 0.12),
      r: Math.random() * 1.6 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      hue: Math.random() > 0.4 ? 20 : 40,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += (Math.random() - 0.5) * 0.015;
        p.alpha = Math.max(0.03, Math.min(0.6, p.alpha));

        if (p.y < -6) {
          p.y = canvas.height + 6;
          p.x = Math.random() * canvas.width;
          p.alpha = 0.4;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        g.addColorStop(0, `hsl(${p.hue}, 100%, 75%)`);
        g.addColorStop(0.4, `hsla(${p.hue}, 100%, 50%, 0.3)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 size-full pointer-events-none"
      aria-hidden
    />
  );
}

/* ─── Animated SVG Radar Sweep ─── */
function RadarSweep() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10"
      aria-hidden
    >
      <svg
        viewBox="0 0 400 400"
        className="size-[180px] sm:size-[320px] md:size-[420px] opacity-10 sm:opacity-15"
      >
        {[60, 120, 180].map((r) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.5"
            strokeDasharray="4 6"
            opacity="0.5"
          />
        ))}
        <line
          x1="200"
          y1="20"
          x2="200"
          y2="380"
          stroke="var(--primary)"
          strokeWidth="0.3"
          opacity="0.3"
        />
        <line
          x1="20"
          y1="200"
          x2="380"
          y2="200"
          stroke="var(--primary)"
          strokeWidth="0.3"
          opacity="0.3"
        />
        <g className="animate-radar-sweep" style={{ transformOrigin: "200px 200px" }}>
          <defs>
            <linearGradient
              id="sweep-grad"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
              gradientTransform="rotate(0 0.5 0.5)"
            >
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M200,200 L200,20 A180,180,0,0,1,356,116 Z"
            fill="url(#sweep-grad)"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}

/* ─── Split-Flap Countdown Digit ─── */
function FlipDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative flex gap-[2px]">
        {value.split("").map((digit, i) => (
          <div
            key={i}
            className="relative flex h-10 w-7 sm:h-14 sm:w-10 items-center justify-center border border-primary/50 bg-black/90 font-display text-sm sm:text-2xl font-black text-foreground shadow-md"
          >
            <span className="relative z-10">{digit}</span>
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-primary/40" />
          </div>
        ))}
      </div>
      <span className="font-mono-tech text-[8px] sm:text-[10px] uppercase text-muted-foreground tracking-widest">
        {label}
      </span>
    </div>
  );
}

/* ─── HERO MAIN ─── */
export function Hero({ onRegister }: { onRegister: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [clock, setClock] = useState<string | null>(null);
  const [cd, setCd] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().slice(17, 25) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Event Date: 23 September 2026
    const target = new Date("2026-09-23T09:30:00").getTime();
    const update = () => {
      const dist = Math.max(0, target - Date.now());
      setCd({
        d: String(Math.floor(dist / 86400000)).padStart(2, "0"),
        h: String(Math.floor((dist % 86400000) / 3600000)).padStart(2, "0"),
        m: String(Math.floor((dist % 3600000) / 60000)).padStart(2, "0"),
        s: String(Math.floor((dist % 60000) / 1000)).padStart(2, "0"),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (!sectionRef.current || !imgRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Image scale-fade: grows from 0.92 to 1.0 as it enters
      gsap.fromTo(
        imgRef.current,
        { scale: 0.92, opacity: 0.7 },
        {
          scale: 1,
          opacity: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  /* ── Intro sequence played persistence ── */
  const [introDone, setIntroComplete] = useState(() =>
    loadState<boolean>(STORAGE_KEYS.INTRO_PLAYED, false),
  );

  const handleIntroDone = useCallback(() => {
    saveState(STORAGE_KEYS.INTRO_PLAYED, true);
    setIntroComplete(true);
  }, []);

  return (
    <>
      {!introDone && <CinematicIntro onComplete={handleIntroDone} />}
      <section id="top" ref={sectionRef} className="relative isolate overflow-hidden scanlines">
        {/* Crisp Classic Hero Cataclysm Background Layers */}
        <img
          ref={imgRef}
          src={heroImage}
          alt="Planetary Defence Cataclysm"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-20 size-full object-cover object-[center_30%] opacity-60 brightness-[0.85] contrast-110 saturate-[1.15]"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,transparent_25%,var(--background)_90%)]" />
        <div className="absolute inset-0 -z-10 grid-tactical opacity-30 pointer-events-none" />
        <EmberCanvas />
        <div className="absolute bottom-0 inset-x-0 h-32 sm:h-48 bg-gradient-to-t from-background to-transparent pointer-events-none -z-10" />

        {/* Hero Interactive Content Layer */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-6xl flex-col items-center px-2 py-3 text-center sm:px-6 lg:px-8 sm:py-8"
        >
          {/* ── DEFCON Badge ── */}
          <motion.div
            variants={fadeUpBlur}
            className="inline-flex items-center gap-2 border border-primary/60 bg-primary/15 px-3 py-1 sm:px-4 sm:py-1.5 clip-tactical mb-2.5 sm:mb-3"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <Radio className="size-3 text-primary animate-pulse" />
            <span className="font-mono-tech text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.25em] text-accent font-bold">
              DEFCON 1 PROTOCOL {clock ? `// ${clock}` : ""}
            </span>
          </motion.div>

          {/* ── College Header (Responsive Mobile Layout) ── */}
          <motion.div variants={fadeUpBlur} className="w-full max-w-5xl px-1 sm:px-4">
            <div className="flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-6">
              <div className="shrink-0">
                <div className="size-12 sm:size-24 md:size-28 flex items-center justify-center transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_15px_rgba(255,200,0,0.4)] animate-float">
                  <img
                    src="/images/jec-emblem.png?v=20260826"
                    alt="Jaya Educational Trust Emblem"
                    className="size-full object-contain filter drop-shadow-md"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center px-1">
                <h2 className="font-display text-xs sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight sm:tracking-wide text-foreground leading-tight">
                  JAYA ENGINEERING COLLEGE
                </h2>
                <p className="mt-0.5 font-mono-tech text-[7px] sm:text-xs md:text-sm text-muted-foreground font-medium">
                  Accredited by NAAC & NBA | Approved by AICTE | Affiliated to Anna University
                </p>
                <p className="mt-0.5 font-mono-tech text-[7px] sm:text-[11px] text-accent font-bold tracking-wide">
                  📍 CTH Road, Thiruninravur, Chennai — 602024
                </p>
              </div>

              <div className="shrink-0">
                <div
                  className="size-12 sm:size-24 md:size-28 flex items-center justify-center transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_15px_rgba(255,200,0,0.4)] animate-float"
                  style={{ animationDelay: "1s" }}
                >
                  <img
                    src="/images/jec-31years.png?v=20260826"
                    alt="31 Years of Excellence"
                    className="size-full object-contain filter drop-shadow-md"
                  />
                </div>
              </div>
            </div>

            <div className="mt-2.5 sm:mt-3 pt-1 sm:pt-2 space-y-1.5 sm:space-y-2">
              <p className="font-mono-tech text-[9px] sm:text-sm md:text-base tracking-[0.12em] sm:tracking-[0.2em] uppercase text-primary font-black">
                DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING
              </p>
              <span className="inline-block border border-accent/50 bg-accent/15 px-3 py-0.5 sm:px-4 sm:py-1 clip-tactical font-mono-tech text-[9px] sm:text-xs tracking-[0.25em] uppercase text-accent font-bold">
                // PRESENTS
              </span>
            </div>
          </motion.div>

          {/* ── Main Event Title ── */}
          <div className="relative mt-2 sm:mt-4">
            <RadarSweep />
            <div className="px-2 py-1 sm:px-8 sm:py-4">
              <motion.h1 variants={fadeUpBlur} className="font-display uppercase">
                <span
                  className="block text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tighter"
                  style={{
                    textShadow: "0 0 30px rgba(255,255,255,0.2), 0 0 60px rgba(224,76,17,0.15)",
                  }}
                >
                  MAKEATHON
                </span>
                <span className="mt-1 block text-base sm:text-3xl md:text-4xl lg:text-5xl font-extrabold shimmer-text tracking-wide">
                  PROJECT ZEROTH HOUR
                </span>
              </motion.h1>
            </div>
            <Crosshair className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 size-5 sm:size-8 text-primary/40 animate-float" />
          </div>

          {/* ── Split-Flap Countdown ── */}
          <motion.div variants={fadeUpBlur} className="mt-16 sm:mt-28 px-2 py-1">
            <div className="flex items-center gap-1.5 mb-1.5 justify-center">
              <Shield className="size-3 sm:size-3.5 text-primary" />
              <span className="font-mono-tech text-[8px] sm:text-[9px] tracking-[0.2em] text-primary font-bold uppercase">
                Time to Zero Hour
              </span>
            </div>
            <div className="flex items-start gap-1 sm:gap-2 justify-center">
              <FlipDigit value={cd.d} label="Days" />
              <span className="font-display text-xs sm:text-lg font-black text-primary mt-1 animate-flicker">
                :
              </span>
              <FlipDigit value={cd.h} label="Hrs" />
              <span className="font-display text-xs sm:text-lg font-black text-primary mt-1 animate-flicker">
                :
              </span>
              <FlipDigit value={cd.m} label="Min" />
              <span className="font-display text-xs sm:text-lg font-black text-primary mt-1 animate-flicker">
                :
              </span>
              <FlipDigit value={cd.s} label="Sec" />
            </div>
          </motion.div>

          {/* ── Date & Venue (Updated Date: SEPT 23) ── */}
          <motion.div
            variants={fadeUpBlur}
            className="mt-3.5 sm:mt-4 flex w-full max-w-md items-center gap-2.5 sm:gap-3 border border-accent/70 bg-black/80 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 clip-tactical text-left shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            <Calendar className="size-4 sm:size-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="font-display text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-accent">
                SEPT 23 // 5-HOUR MAKEATHON
              </p>
              <p className="font-mono-tech text-[9px] sm:text-[11px] text-white/90 font-medium">
                Venue: Jaya Auditorium · Registration queue open
              </p>
            </div>
          </motion.div>

          {/* ── CTA Buttons ── */}
          <motion.div
            variants={fadeUpBlur}
            className="mt-4 sm:mt-5 flex flex-col gap-2 sm:flex-row w-full sm:w-auto"
          >
            <Button
              variant="alert"
              size="default"
              onClick={onRegister}
              className="w-full sm:w-auto h-12 sm:h-11 font-bold touch-manipulation group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              <Flame className="size-4" aria-hidden />
              Enlist your squad
              <ChevronRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="tactical"
              size="default"
              asChild
              className="w-full sm:w-auto h-12 sm:h-11 font-bold touch-manipulation group transition-all duration-300 hover:scale-[1.02]"
            >
              <a href="#roadmap">
                <Clock className="size-4" aria-hidden />
                View build schedule
              </a>
            </Button>
          </motion.div>

          {/* ── Prize & Fee Info ── */}
          <motion.div
            variants={fadeUpBlur}
            className="mt-3.5 sm:mt-5 flex w-full max-w-lg flex-row gap-2 sm:gap-3 justify-center"
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-black/85 backdrop-blur-md px-2.5 py-2.5 rounded border border-primary/50">
              <p className="font-mono-tech text-[8px] sm:text-[10px] tracking-[0.18em] text-accent font-bold">
                PRIZE CACHE
              </p>
              <p className="font-display text-lg sm:text-3xl font-black text-foreground">₹22K</p>
              <p className="font-mono-tech text-[8px] sm:text-[10px] text-white/90 font-semibold text-center">
                + MERCH & CERTS
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-black/85 backdrop-blur-md px-2.5 py-2.5 rounded border border-accent/50">
              <p className="font-mono-tech text-[8px] sm:text-[10px] tracking-[0.18em] text-accent font-bold">
                REGISTRATION
              </p>
              <p className="font-display text-lg sm:text-3xl font-black text-foreground">₹200</p>
              <p className="font-mono-tech text-[8px] sm:text-[10px] text-white/90 font-semibold text-center">
                FOOD & WI-FI INCLUDED
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
