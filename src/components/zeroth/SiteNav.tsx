import { useEffect, useState } from "react";
import { Menu, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TABS: { id: "home" | "events" | "about"; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "events", label: "Events" },
  { id: "about", label: "About" },
];

const SECTION_ANCHORS = ["#top", "#briefing", "#sectors", "#roadmap", "#intel"];

export function SiteNav({
  onRegister,
  activeTab,
  onTabChange,
}: {
  onRegister: () => void;
  activeTab: "home" | "events" | "about";
  onTabChange: (tab: "home" | "events" | "about") => void;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [open]);

  const handleTab = (tab: "home" | "events" | "about") => {
    // Close mobile menu first
    setOpen(false);
    // Defer tab change to next frame so mobile menu close animation completes
    requestAnimationFrame(() => {
      onTabChange(tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? "border-primary/35 bg-background/85 backdrop-blur-xl" : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => handleTab("home")}
          className="flex items-center gap-2.5"
          aria-label="Go to home tab"
        >
          <span className="grid size-10 place-items-center border border-primary/60 bg-primary/15 clip-tactical text-primary">
            <ShieldAlert className="size-5" aria-hidden />
          </span>
          <span className="w-px h-8 bg-primary/30 hidden sm:block" aria-hidden />
          <span className="leading-none">
            <span className="block font-display text-sm font-black tracking-[0.2em] text-foreground">
              ZEROTH HOUR
            </span>
            <span className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] tracking-[0.18em] text-muted-foreground">
                GLOBAL CRISIS MAKEATHON
              </span>
              <span className="hidden sm:inline font-mono-tech text-[7px] tracking-[0.15em] text-terminal-green">
                REV 2.6
              </span>
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {TABS.map((l) => (
            <button
              key={l.id}
              onClick={() => handleTab(l.id)}
              className={`group relative flex items-center px-3 py-2 font-mono-tech text-[11px] uppercase tracking-[0.2em] transition-colors touch-manipulation before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-full before:bg-accent before:content-[''] before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] hover:before:origin-left hover:before:scale-x-100 ${
                activeTab === l.id
                  ? "text-accent before:scale-x-100 before:origin-left"
                  : "text-muted-foreground hover:text-accent"
              }`}
              aria-current={activeTab === l.id ? "page" : undefined}
            >
              {l.label}
            </button>
          ))}
          <span className="flex items-center gap-1.5 px-2 font-mono-tech text-[9px] tracking-[0.15em] text-terminal-green">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-terminal-green opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-terminal-green" />
            </span>
            LIVE
          </span>
          <Button variant="alert" size="default" className="ml-3" onClick={onRegister}>
            Register
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="alert"
            size="sm"
            onClick={onRegister}
            className="font-mono-tech text-[10px] tracking-wider px-3 min-h-[44px] touch-manipulation"
          >
            REGISTER
          </Button>
          <button
            className="grid size-11 place-items-center border border-border text-foreground clip-tactical touch-manipulation min-h-[44px] min-w-[44px] cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-background/98 px-4 pb-5 pt-2 backdrop-blur-xl md:hidden"
          >
            {TABS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => handleTab(l.id)}
                style={{ animationDelay: `${i * 0.05}s` }}
                className={`animate-slide-x flex w-full items-center justify-between border-b border-border/60 py-4 min-h-[48px] text-left font-mono-tech text-xs uppercase tracking-[0.2em] transition-colors touch-manipulation ${
                  activeTab === l.id ? "text-accent" : "text-muted-foreground hover:text-accent"
                }`}
              >
                <span>{l.label}</span>
                {activeTab === l.id && <span className="size-1.5 rounded-full bg-accent" />}
              </button>
            ))}
            <Button
              variant="alert"
              className="mt-4 w-full group hover:shadow-[0_0_20px_rgba(224,76,17,0.4)] transition-shadow"
              onClick={() => {
                setOpen(false);
                onRegister();
              }}
            >
              Register squad
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
