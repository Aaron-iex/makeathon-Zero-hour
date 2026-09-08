import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Radio,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Target,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQS, STATS } from "@/data/zeroth";
import { loadState, saveState, STORAGE_KEYS } from "@/lib/state-persistence";

import { Linkedin, Phone } from "lucide-react";

type Member = {
  name: string;
  role: string;
  org: string;
  initials: string;
  image?: string;
  imagePos?: string;
  specialty?: string;
  phone?: string;
  linkedin?: string;
};

const HOD: Member = {
  name: "Dr. A. Saravanan",
  role: "Head of Department, ECE",
  org: "Faculty Mentor",
  initials: "AS",
  image: "/images/coordinators/hod.jpg",
  imagePos: "center -2%",
};

const FACULTY_COORDINATORS: Member[] = [
  {
    name: "V. Jaya Prakash",
    role: "Faculty Coordinator",
    org: "Department of ECE",
    initials: "VJ",
  },
];

const STUDENT_COORDINATORS: Member[] = [
  {
    name: "Aaron Nissi",
    role: "Event Head",
    org: "Student Coordinator",
    specialty: "Overall Operations & Lead",
    phone: "+91-6381198548",
    image: "/images/coordinators/aaron.jpg",
    imagePos: "center 62%",
    initials: "AN",
    linkedin: "https://www.linkedin.com/in/aaron-nissi-mylabathula/",
  },
  {
    name: "K.J John Victor",
    role: "Technical Head",
    org: "Student Coordinator",
    specialty: "Infrastructure & Tools",
    phone: "+91-9566227078",
    image: "/images/coordinators/john.jpg",
    imagePos: "center 18%",
    initials: "JV",
    linkedin: "https://www.linkedin.com/in/john-victor-0828702a5/",
  },
  {
    name: "R. Dhanush",
    role: "Registration Lead",
    org: "Student Coordinator",
    specialty: "Onboarding & Operations",
    phone: "+91-8883396400",
    image: "/images/coordinators/dhanushr.jpg",
    imagePos: "center 10%",
    initials: "RD",
    linkedin: "https://www.linkedin.com/in/dhanush-raja-4203962a6/",
  },
  {
    name: "K. Vigneshwaran",
    role: "Logistics Head",
    org: "Student Coordinator",
    specialty: "Venue & Equipment",
    phone: "+91-9840102544",
    initials: "KV",
    linkedin: "https://www.linkedin.com/in/vigneswaran-k-a2b5722a5/",
  },
  {
    name: "Sai Rahul",
    role: "Event Co-Ordinator",
    org: "Student Coordinator",
    specialty: "Broadcast & Communications",
    initials: "SR",
    phone: "+91-9789051578",
    linkedin: "https://www.linkedin.com/in/sai-rahul1113/",
  },
];

export function Intel({ preview, onExpand }: { preview?: boolean; onExpand?: () => void }) {
  const [open, setOpenRaw] = useState<number>(() =>
    loadState<number>(STORAGE_KEYS.INTEL_ACCORDION, 0),
  );

  const setOpen = useCallback((idx: number) => {
    setOpenRaw(idx);
    saveState(STORAGE_KEYS.INTEL_ACCORDION, idx);
  }, []);

  return (
    <section id="intel" className="mx-auto max-w-7xl px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
      {/* ── MISSION BRIEFING: ENGINEERING THE LAST HOUR ── */}
      <div id="briefing" className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-primary" />
            <span className="font-mono-tech text-[11px] tracking-[0.25em] text-primary uppercase font-bold">
              // CLASSIFIED MISSION BRIEFING
            </span>
            <span className="h-px w-6 bg-primary" />
          </div>

          <h2 className="font-display text-[clamp(1.75rem,5vw,3rem)] font-black uppercase leading-tight">
            Engineering the <span className="text-alert-gradient">last hour</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-foreground font-medium">
            <strong className="text-primary">Project Zeroth Hour</strong> is a high-stakes 5-hour
            crisis response makeathon engineered around one urgent premise:{" "}
            <span className="text-accent font-semibold">
              the cataclysm warning has already fired
            </span>
            .
          </p>

          <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
            Student squads rapidly prototype tangible hardware & embedded systems designed to{" "}
            <strong className="text-foreground">sense real-time threats</strong>,{" "}
            <strong className="text-foreground">execute rapid decision logic</strong>, and{" "}
            <strong className="text-foreground">trigger physical mechanical adaptations</strong>{" "}
            across 5 fronts of planetary survival.
          </p>

          {/* Key Mission Directives Grid */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono-tech text-xs">
            <div className="flex items-center gap-2.5 p-3 border border-primary/40 bg-primary/10 clip-tactical">
              <Zap className="size-4 text-primary shrink-0" />
              <span className="text-foreground font-bold">
                Physical Sensor + Actuation Mandatory
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-3 border border-accent/40 bg-accent/10 clip-tactical">
              <AlertTriangle className="size-4 text-accent shrink-0" />
              <span className="text-foreground font-bold">Live Disaster Injection at Midpoint</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 border border-primary/40 bg-primary/10 clip-tactical">
              <Target className="size-4 text-primary shrink-0" />
              <span className="text-foreground font-bold">5-Hour High-Intensity Rapid Build</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 border border-accent/40 bg-accent/10 clip-tactical">
              <Flame className="size-4 text-accent shrink-0" />
              <span className="text-foreground font-bold">₹22,000 Prize Cache + Merch</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
            <span className="flex items-center gap-2 border border-primary/60 bg-primary/15 px-3.5 py-2 font-mono-tech text-[11px] tracking-[0.18em] text-primary font-bold clip-tactical">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden /> ₹200 / SQUAD
            </span>
            <span className="flex items-center gap-2 border border-accent/60 bg-accent/15 px-3.5 py-2 font-mono-tech text-[11px] tracking-[0.18em] text-accent font-bold clip-tactical">
              <Radio className="size-3.5 text-accent animate-pulse" aria-hidden /> JAYA AUDITORIUM ·
              CHENNAI
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.25em] text-primary uppercase font-bold">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            // TELEMETRY DATA STREAM
          </div>
          <motion.dl
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-3.5 sm:gap-4"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="panel-tactical p-4 sm:p-5 border border-primary/40 bg-primary/5 hover:border-primary/80 transition-colors"
              >
                <dt className="font-mono-tech text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-bold">
                  {s.label}
                </dt>
                <dd className="mt-2 font-display text-2xl sm:text-3xl font-black text-alert-gradient telemetry-readout">
                  {s.value || s.val}
                </dd>
                {s.desc && (
                  <p className="mt-1 font-mono-tech text-[10px] text-accent/90">{s.desc}</p>
                )}
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      {preview ? (
        <div className="mt-10 text-center">
          <Button variant="tactical" size="xl" onClick={onExpand} className="min-h-[44px]">
            <ChevronRight className="size-4" aria-hidden />
            View full mission briefing
          </Button>
        </div>
      ) : (
        <>
          {/* ECE HOD Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h3 className="font-display text-2xl font-black uppercase">
              ECE <span className="text-accent">HOD</span>
            </h3>
            <div className="mt-6 max-w-md">
              <article className="panel-tactical p-6 border border-primary/40">
                <div className="flex items-center justify-between">
                  {HOD.image ? (
                    <div className="relative size-20 sm:size-24 overflow-hidden border border-primary/70 bg-card/80">
                      <img
                        src={HOD.image}
                        alt={HOD.name}
                        style={{ objectPosition: HOD.imagePos || "center center" }}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="grid size-14 place-items-center border-2 border-accent/60 bg-accent/15 font-display text-lg font-black text-accent clip-tactical">
                      {HOD.initials}
                    </span>
                  )}
                  {HOD.linkedin && (
                    <a
                      href={HOD.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="LinkedIn profile"
                      className="size-9 place-items-center border border-border bg-card/60 text-muted-foreground transition-colors hover:border-primary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    >
                      <Linkedin className="size-4" />
                    </a>
                  )}
                </div>
                <h4 className="mt-5 font-display text-xl font-black text-foreground tracking-wide">
                  {HOD.name}
                </h4>
                <p className="mt-1 font-mono-tech text-xs tracking-wider text-primary font-bold uppercase">
                  {HOD.role}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground font-medium">{HOD.org}</p>
              </article>
            </div>
          </motion.div>

          {/* Faculty Coordinators Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h3 className="font-display text-2xl font-black uppercase">
              Faculty <span className="text-accent">Co-ordinators</span>
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 max-w-3xl">
              {FACULTY_COORDINATORS.map((m) => (
                <article
                  key={m.name}
                  className="panel-tactical p-6 border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-14 place-items-center border-2 border-accent/60 bg-accent/15 font-display text-lg font-black text-accent clip-tactical">
                      {m.initials}
                    </span>
                    {m.linkedin && (
                      <a
                        href={m.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn profile"
                        className="size-9 place-items-center border border-border bg-card/60 text-muted-foreground transition-colors hover:border-primary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                      >
                        <Linkedin className="size-4" />
                      </a>
                    )}
                  </div>
                  <h4 className="mt-5 font-display text-xl font-black text-foreground tracking-wide">
                    {m.name}
                  </h4>
                  <p className="mt-1 font-mono-tech text-xs tracking-wider text-primary font-bold uppercase">
                    {m.role}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground font-medium">{m.org}</p>
                </article>
              ))}
            </div>
          </motion.div>

          {/* Student Coordinators Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 ascii-corners relative p-4"
          >
            <h3 className="font-display text-2xl font-black uppercase">
              Student <span className="text-accent">Co-ordinators</span>
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STUDENT_COORDINATORS.map((m) => (
                <article
                  key={m.name}
                  className="panel-tactical p-6 border border-border/80 hover:border-primary/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      {m.image ? (
                        <div className="relative size-20 sm:size-24 overflow-hidden border border-primary/70 bg-card/80">
                          <img
                            src={m.image}
                            alt={m.name}
                            style={{ objectPosition: m.imagePos || "center center" }}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="grid size-14 place-items-center border-2 border-accent/60 bg-accent/15 font-display text-lg font-black text-accent clip-tactical">
                          {m.initials}
                        </span>
                      )}

                      {m.linkedin && (
                        <a
                          href={m.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${m.name} LinkedIn`}
                          className="size-9 place-items-center border border-border bg-card/60 text-muted-foreground transition-colors hover:border-primary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        >
                          <Linkedin className="size-4" />
                        </a>
                      )}
                    </div>

                    <h4 className="mt-5 font-display text-xl font-black text-foreground tracking-wide">
                      {m.name}
                    </h4>
                    <p className="mt-1 font-mono-tech text-xs tracking-wider text-primary font-bold uppercase">
                      {m.role}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground font-medium">{m.org}</p>
                    <p className="mt-2 font-mono-tech text-xs text-accent font-semibold">
                      // {m.specialty}
                    </p>
                  </div>

                  {m.phone && (
                    <div className="mt-5 border-t border-border/80 pt-4">
                      <a
                        href={`tel:${m.phone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-2 font-mono-tech text-sm font-bold text-accent transition-colors hover:text-primary min-h-[44px] touch-manipulation"
                      >
                        <Phone className="size-3.5 text-primary shrink-0" />
                        {m.phone}
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Transmission complete stamp */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 font-mono-tech text-[9px] text-muted-foreground/70 uppercase tracking-[0.2em]">
              <span>SEC-COMMS // FIELD TRANSMISSION COMPLETE</span>
              <span className="text-terminal-green font-bold">● SIGNAL 100% NOMINAL</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <h3 className="font-display text-[clamp(1.25rem,4vw,2rem)] font-black uppercase">
              Frequently intercepted <span className="text-accent">questions</span>
            </h3>
            <div className="divide-y divide-border border-y border-border">
              {FAQS.map((f, i) => (
                <div key={f.q}>
                  <button
                    onClick={() => setOpen(open === i ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left min-h-[44px] touch-manipulation"
                    aria-expanded={open === i}
                  >
                    <span className="font-display text-base font-bold">{f.q}</span>
                    <span className="font-mono-tech text-primary text-sm shrink-0" aria-hidden>
                      {open === i ? "[-]" : "[+]"}
                    </span>
                  </button>
                  {open === i && (
                    <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </section>
  );
}
