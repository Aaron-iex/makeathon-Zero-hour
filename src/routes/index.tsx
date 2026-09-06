import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { EmergencyTicker } from "@/components/zeroth/EmergencyTicker";
import { SiteNav } from "@/components/zeroth/SiteNav";
import { Hero } from "@/components/zeroth/Hero";
import { Sectors } from "@/components/zeroth/Sectors";
import { Roadmap } from "@/components/zeroth/Roadmap";
import { Intel } from "@/components/zeroth/Intel";
import { SiteFooter } from "@/components/zeroth/SiteFooter";
import { Sponsors } from "@/components/zeroth/Sponsors";
import { RegisterDialog } from "@/components/zeroth/RegisterDialog";
import { SabotageQuiz } from "@/components/zeroth/SabotageQuiz";
import { FilmGrain } from "@/components/zeroth/FilmGrain";
import { loadState, saveState, STORAGE_KEYS } from "@/lib/state-persistence";

const TITLE = "Zeroth Hour — 5-Hour Planetary Defence Makeathon";
const DESCRIPTION =
  "Jaya Engineering College Department of ECE presents Makeathon: Project Zeroth Hour. Join 500+ engineers for a 5-hour makeathon across five fronts of planetary defence. 22,000 INR overall prize cache.";

type Tab = "home" | "events" | "about";

/** Read active tab strictly from URL hash. Defaults to "home". */
function getTabFromHash(): Tab {
  if (typeof window === "undefined") return "home";
  const raw = window.location.hash.replace("#", "").toLowerCase();
  if (raw === "events" || raw === "about") {
    return raw;
  }
  return "home";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState("");

  const [tab, setTabRaw] = useState<Tab>(getTabFromHash);
  const scrollPositionsRef = useRef<Record<Tab, number>>(
    loadState<Record<Tab, number>>(STORAGE_KEYS.TAB_SCROLLS, { home: 0, events: 0, about: 0 }),
  );

  /** Save current scroll position before switching tabs */
  const saveCurrentScroll = useCallback((currentTab: Tab) => {
    if (typeof window === "undefined") return;
    scrollPositionsRef.current[currentTab] = window.scrollY;
    saveState(STORAGE_KEYS.TAB_SCROLLS, scrollPositionsRef.current);
  }, []);

  /** Change tab with hash synchronization and smooth scroll restoration */
  const setTab = useCallback(
    (next: Tab) => {
      saveCurrentScroll(tab);
      setTabRaw(next);

      const targetHash = next === "home" ? "" : `#${next}`;
      if (window.location.hash !== (targetHash || "#")) {
        const url = targetHash || window.location.pathname;
        window.history.pushState({ tab: next }, "", url);
      }

      // Restore target tab's scroll position
      setTimeout(() => {
        const targetScroll = scrollPositionsRef.current[next] || 0;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }, 50);
    },
    [tab, saveCurrentScroll],
  );

  /** Listen for browser Back/Forward (popstate) to synchronize active tab */
  useEffect(() => {
    const onPop = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();

      // Don't switch tabs if popstate was for a modal close (#register or #crisis-...)
      if (hash === "register" || hash.startsWith("crisis-")) {
        return;
      }

      const nextTab = hash === "events" || hash === "about" ? hash : "home";
      // ONLY switch tabs and restore scroll if the tab actually changed
      if (nextTab !== tab) {
        saveCurrentScroll(tab);
        setTabRaw(nextTab);

        setTimeout(() => {
          const targetScroll = scrollPositionsRef.current[nextTab] || 0;
          window.scrollTo({ top: targetScroll, behavior: "smooth" });
        }, 50);
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [tab, saveCurrentScroll]);

  /** Save scroll positions on beforeunload */
  useEffect(() => {
    const onUnload = () => saveCurrentScroll(tab);
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [tab, saveCurrentScroll]);

  const openRegister = useCallback((selected = "") => {
    setTrack(selected);
    setOpen(true);
  }, []);

  const closeRegister = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#register") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Popstate listener for register dialog close
  useEffect(() => {
    const onPop = () => {
      if (window.location.hash !== "#register") {
        setOpen(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <FilmGrain />
      <EmergencyTicker />
      <SiteNav onRegister={() => openRegister()} activeTab={tab} onTabChange={setTab} />
      <main>
        {tab === "home" && (
          <>
            <Hero onRegister={() => openRegister()} />
            <Sponsors />
            <Sectors onRegister={openRegister} />
            <SabotageQuiz />
            <Roadmap onRegister={() => openRegister()} preview onExpand={() => setTab("events")} />
            <Intel preview onExpand={() => setTab("about")} />
          </>
        )}
        {tab === "events" && (
          <>
            <Roadmap onRegister={() => openRegister()} />
            <Sectors onRegister={openRegister} />
            <SabotageQuiz />
          </>
        )}
        {tab === "about" && <Intel />}
      </main>
      <SiteFooter />
      <RegisterDialog open={open} onClose={closeRegister} initialTrack={track} />
    </div>
  );
}
