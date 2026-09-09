import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Copy, Flame, ShieldCheck, X, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRACKS } from "@/data/zeroth";
import {
  submitRegistrationData,
  BACKUP_GOOGLE_FORM_URL,
  type SubmissionResult,
} from "@/lib/registrations";
import { loadState, saveState, clearState, debounce, STORAGE_KEYS } from "@/lib/state-persistence";

type Props = {
  open: boolean;
  onClose: () => void;
  initialTrack?: string;
};

type FormData = {
  teamName: string;
  leaderName: string;
  email: string;
  phone: string;
  institution: string;
  track: string;
  teamSize: string;
  brief: string;
};

const DEFAULT_FORM: FormData = {
  teamName: "",
  leaderName: "",
  email: "",
  phone: "",
  institution: "",
  track: TRACKS[0]!.title,
  teamSize: "4",
  brief: "",
};

const FIELD =
  "w-full border border-border bg-input/80 px-3 py-2.5 text-[16px] sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-none appearance-none font-mono-tech text-[11px] tracking-[0.1em] uppercase";
const LABEL =
  "font-mono-tech text-[11px] tracking-[0.18em] text-muted-foreground uppercase block mb-1";

export function RegisterDialog({ open, onClose, initialTrack }: Props) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced auto-saver for form inputs
  const debouncedSaveRef = useRef(
    debounce((data: FormData) => {
      saveState(STORAGE_KEYS.REGISTRATION_DRAFT, data);
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 1800);
    }, 1000),
  );

  // On dialog opening: check for draft and handle history state
  useEffect(() => {
    if (!open) {
      setSubmission(null);
      return;
    }

    // 1. Check for saved draft
    const saved = loadState<FormData | null>(STORAGE_KEYS.REGISTRATION_DRAFT, null);
    if (saved && (saved.teamName || saved.leaderName || saved.email || saved.phone)) {
      setForm({
        ...saved,
        track: initialTrack || saved.track || TRACKS[0]!.title,
      });
      setDraftRestored(true);
    } else if (initialTrack) {
      setForm((f) => ({ ...f, track: initialTrack }));
    }

    // 2. Add history entry for dialog back-button closing
    if (window.location.hash !== "#register") {
      window.history.pushState({ modal: "register" }, "", "#register");
    }
  }, [open, initialTrack]);

  // Escape key and popstate handling
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onPopState = () => {
      if (window.location.hash !== "#register") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const set = (k: keyof FormData) => (e: { target: { value: string } }) => {
    const val = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: val };
      debouncedSaveRef.current(next);
      return next;
    });
  };

  const handleClearDraft = useCallback(() => {
    clearState(STORAGE_KEYS.REGISTRATION_DRAFT);
    setForm({
      ...DEFAULT_FORM,
      track: initialTrack || TRACKS[0]!.title,
    });
    setDraftRestored(false);
  }, [initialTrack]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitRegistrationData(form);
      setSubmission(res);
      // Clear auto-saved draft upon successful submission
      clearState(STORAGE_KEYS.REGISTRATION_DRAFT);
      setDraftRestored(false);
    } catch (err) {
      console.error(err);
      window.location.href = BACKUP_GOOGLE_FORM_URL;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  const copy = async () => {
    if (!submission?.id) return;
    await navigator.clipboard.writeText(submission.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Squad enrollment protocol"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-full overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch p-2 sm:p-4 pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex min-h-full items-start sm:items-center justify-center">
          <div className="panel-tactical my-2 sm:my-8 w-full max-w-2xl shadow-[var(--shadow-panel)] border border-primary/50 overflow-hidden animate-rise">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-primary/40 bg-primary/15 px-3.5 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[9px] sm:text-[10px] tracking-[0.2em] text-primary font-bold block">
                    DEFCON 1 // CLEARANCE REQUEST
                  </span>
                  {showSavedIndicator && (
                    <span className="inline-flex items-center gap-1 font-mono-tech text-[9px] text-terminal-green font-bold animate-pulse">
                      <Save className="size-3" /> Draft saved
                    </span>
                  )}
                </div>
                <h2 className="font-display text-sm sm:text-lg font-black uppercase text-foreground truncate">
                  Squad enrollment protocol
                </h2>
              </div>
              <button
                onClick={onClose}
                className="grid size-8 place-items-center border border-border text-muted-foreground hover:border-primary hover:text-foreground transition-colors touch-manipulation cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Restored draft notice */}
            {draftRestored && !submission && (
              <div className="flex items-center justify-between border-b border-primary/30 bg-primary/10 px-3.5 py-2 sm:px-6 text-[11px] font-mono-tech text-primary">
                <span>// Draft restored from terminal cache</span>
                <button
                  onClick={handleClearDraft}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground underline touch-manipulation"
                >
                  <RotateCcw className="size-3" /> Clear
                </button>
              </div>
            )}

            {/* Content: confirmation or form */}
            {submission ? (
              <div className="p-4 sm:p-6 text-center space-y-4">
                <div className="inline-grid size-12 place-items-center rounded-full border border-primary/60 bg-primary/20 text-primary">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-foreground">
                    Enrollment Authorized
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Squad transmission registered. Keep this clearance code safe:
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 border border-primary/40 bg-background/80 px-3 py-2 font-mono-tech text-sm sm:text-base text-primary">
                  <span className="font-mono-tech text-terminal-green text-sm tracking-wider">
                    [ CLEARANCE GRANTED //{" "}
                    {submission.id.startsWith("ZH-") ? submission.id : `ZH-${submission.id}`} ]
                  </span>
                  <button
                    onClick={copy}
                    className="ml-2 text-muted-foreground hover:text-primary transition-colors touch-manipulation"
                    aria-label="Copy submission ID"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
                {copied && (
                  <p className="font-mono-tech text-[10px] text-terminal-green">
                    Copied to tactical clipboard
                  </p>
                )}

                <div className="border border-border/80 bg-card/60 p-3 text-left font-mono-tech text-[10px] sm:text-xs text-muted-foreground space-y-1">
                  <p className="break-words">
                    <span className="text-foreground font-bold">Team:</span> {form.teamName}
                  </p>
                  <p className="break-words">
                    <span className="text-foreground font-bold">Leader:</span> {form.leaderName} (
                    {form.phone})
                  </p>
                  <p className="break-words">
                    <span className="text-foreground font-bold">Institution:</span>{" "}
                    {form.institution}
                  </p>
                  <p className="break-words">
                    <span className="text-foreground font-bold">Front:</span> {form.track}
                  </p>
                  <p>
                    <span className="text-foreground font-bold">Squad size:</span> {form.teamSize}{" "}
                    operators
                  </p>
                </div>

                <div className="flex items-center gap-2 border border-accent/40 bg-accent/10 p-2.5 text-left font-mono-tech text-[10px] text-accent">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>
                    Bring physical hardware, college IDs, and components on Sept 23. Reporting time:
                    08:30 IST.
                  </span>
                </div>

                <Button
                  variant="tactical"
                  className="w-full font-mono-tech text-xs tracking-wider"
                  onClick={() => {
                    setSubmission(null);
                    setForm(DEFAULT_FORM);
                    onClose();
                  }}
                >
                  Clear Terminal
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>
                      Squad Designation <span className="text-primary ml-0.5">*</span>
                    </label>
                    <input
                      required
                      className={FIELD}
                      placeholder="e.g. Apex Protocol"
                      value={form.teamName}
                      onChange={set("teamName")}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>
                      Squad Leader <span className="text-primary ml-0.5">*</span>
                    </label>
                    <input
                      required
                      className={FIELD}
                      placeholder="Full name"
                      value={form.leaderName}
                      onChange={set("leaderName")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>
                      Comms Link (Email) <span className="text-primary ml-0.5">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      className={FIELD}
                      placeholder="leader@domain.com"
                      value={form.email}
                      onChange={set("email")}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>
                      Emergency Comms (Phone) <span className="text-primary ml-0.5">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      className={FIELD}
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={set("phone")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>
                      College / Base Institution <span className="text-primary ml-0.5">*</span>
                    </label>
                    <input
                      required
                      className={FIELD}
                      placeholder="Institution name"
                      value={form.institution}
                      onChange={set("institution")}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>
                      Target Defence Sector <span className="text-primary ml-0.5">*</span>
                    </label>
                    <select className={FIELD} value={form.track} onChange={set("track")}>
                      {TRACKS.map((t) => (
                        <option
                          key={t.id}
                          value={t.title}
                          className="bg-background text-foreground"
                        >
                          [{t.code}] {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>
                    Squad Size <span className="text-primary ml-0.5">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1", "2", "3", "4"].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => set("teamSize")({ target: { value: sz } })}
                        className={`border py-2 text-center font-mono-tech text-xs tracking-wider transition-colors touch-manipulation min-h-[44px] ${
                          form.teamSize === sz
                            ? "border-primary bg-primary/20 text-primary font-bold"
                            : "border-border bg-input/40 text-muted-foreground hover:border-primary/60"
                        }`}
                      >
                        {sz} {sz === "1" ? "Solo" : "Ops"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Hardware / Implementation Brief (Optional)</label>
                  <textarea
                    rows={2}
                    className={`${FIELD} resize-none`}
                    placeholder="Sensors, actuators, or microcontrollers you plan to deploy..."
                    value={form.brief}
                    onChange={set("brief")}
                  />
                </div>

                <div className="border-t border-border pt-3 sm:pt-4 text-left">
                  <p className="font-mono-tech text-[10px] sm:text-[11px] text-muted-foreground">
                    Fee: <span className="text-accent font-bold">₹200 / squad</span> · Food,
                    high-speed Wi-Fi, mentorship included. Payment collected at check-in counter on
                    Sept 23.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="alert"
                  size="default"
                  className="w-full h-12 sm:h-11 text-sm font-bold tracking-wider uppercase touch-manipulation min-h-[44px]"
                  disabled={isSubmitting}
                >
                  <Flame className="size-4" aria-hidden />
                  {isSubmitting ? "Transmitting Clearance..." : "Transmit Squad Enrollment"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
