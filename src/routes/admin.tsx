import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  getStoredRegistrations,
  saveRegistrationLocally,
  deleteRegistrationLocally,
  exportRegistrationsToCsv,
  getGoogleSheetsWebhookUrl,
  setGoogleSheetsWebhookUrl,
  getPaymentsWebhookUrl,
  setPaymentsWebhookUrl,
  fetchRemoteRegistrations,
  clearStoredRegistrations,
  syncCheckInToRemote,
  syncDeleteToRemote,
  syncPaymentToRemote,
  BACKUP_GOOGLE_FORM_URL,
  DEFAULT_SHEETS_WEBHOOK_URL,
  DEFAULT_PAYMENTS_WEBHOOK_URL,
  type Registration,
} from "@/lib/registrations";
import { TRACKS } from "@/data/zeroth";
import {
  Download,
  Link as LinkIcon,
  RefreshCw,
  Shield,
  Users,
  CheckCircle2,
  Database,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Mail,
  Building2,
  X,
  FileText,
  Radio,
  SlidersHorizontal,
  Layers,
  Sparkles,
  CreditCard,
  MessageCircle,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

function buildWhatsAppUrl(squad: {
  leaderName: string;
  teamName: string;
  id: string;
  phone: string;
}): string {
  let cleanPhone = (squad.phone || "").replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = cleanPhone.replace(/^0+/, "");
  }
  if (cleanPhone.length === 10 && !cleanPhone.startsWith("91")) {
    cleanPhone = `91${cleanPhone}`;
  }

  const message = `Hi ${squad.leaderName}, greetings from Team Zeroth Hour! 🚀

Your squad ${squad.teamName}, ${squad.id} is registered for Zeroth Hour, 5-hour makeathon on Sept 23 at Jaya Auditorium.

To confirm your spot, please complete the payment:
💰 Amount: ₹200 per team
📲 Scan the QR code below to pay

Once paid, send us:
1. A screenshot of the payment
2. The transaction reference ID / UTR number

We'll confirm your slot and send you a confirmation email with your event details and OD letter.

Any questions, just ask here. See you at Zeroth Hour!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function handleWhatsAppClick(
  e: React.MouseEvent,
  squad: {
    leaderName: string;
    teamName: string;
    id: string;
    phone: string;
  },
) {
  e.stopPropagation();
  e.preventDefault();
  const url = buildWhatsAppUrl(squad);
  window.open(url, "_blank", "noopener,noreferrer");
}

interface RegistrationRowProps {
  registration: Registration;
  isCopied: boolean;
  onSelectSquad: (r: Registration) => void;
  onCopy: (text: string, id: string) => void;
  onToggleCheckIn: (r: Registration) => void;
  onTogglePaid: (r: Registration) => void;
  onDeleteSquad: (id: string, name: string) => void;
}

const RegistrationRow = memo(function RegistrationRow({
  registration: r,
  isCopied,
  onSelectSquad,
  onCopy,
  onToggleCheckIn,
  onTogglePaid,
  onDeleteSquad,
}: RegistrationRowProps) {
  return (
    <tr
      className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
      onClick={() => onSelectSquad(r)}
    >
      {/* ID */}
      <td
        className="py-3.5 px-4 font-mono-tech font-bold text-primary whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <span>{r.id}</span>
          <button
            type="button"
            onClick={() => onCopy(r.id, r.id)}
            className="text-neutral-500 hover:text-white p-1 rounded transition-colors"
            title="Copy ID"
          >
            {isCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>
        </div>
      </td>

      {/* Squad Name & Size */}
      <td className="py-3.5 px-4 min-w-[150px] max-w-[220px]">
        <div className="font-bold text-white flex items-center gap-1.5 flex-wrap break-words">
          <span className="break-words">{r.teamName}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tech bg-neutral-800 text-neutral-300 font-normal shrink-0">
            {r.teamSize} {r.teamSize === "1" ? "solo" : "members"}
          </span>
        </div>
        {r.brief && (
          <p
            className="text-[11px] text-neutral-400 break-words line-clamp-2 mt-0.5"
            title={r.brief}
          >
            {r.brief}
          </p>
        )}
      </td>

      {/* Leader & Contact */}
      <td className="py-3.5 px-4 min-w-[190px]" onClick={(e) => e.stopPropagation()}>
        <div
          className="font-medium text-white flex items-center gap-1.5 break-words"
          title={r.leaderName}
        >
          {r.leaderName}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 mt-0.5 text-[11px] font-mono-tech flex-wrap">
          {r.email && (
            <a
              href={`mailto:${r.email}`}
              className="text-neutral-400 hover:text-accent flex items-center gap-1 transition-colors max-w-[160px] truncate"
              title={r.email}
            >
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{r.email}</span>
            </a>
          )}
          {r.phone && (
            <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <a
                href={`tel:${r.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-neutral-400 hover:text-primary flex items-center gap-1 transition-colors shrink-0"
              >
                <Phone className="size-3 shrink-0" />
                <span>{r.phone}</span>
              </a>
              <button
                type="button"
                onClick={(e) => handleWhatsAppClick(e, r)}
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 p-1 rounded transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                title="Chat on WhatsApp"
                aria-label={`Chat with ${r.leaderName} on WhatsApp`}
              >
                <MessageCircle className="size-3.5 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Institution */}
      <td className="py-3.5 px-4 text-neutral-300 min-w-[160px] max-w-[220px]">
        <div className="flex items-start gap-1.5">
          <Building2 className="size-3 text-neutral-500 shrink-0 mt-0.5" />
          <span className="break-words" title={r.institution || "—"}>
            {r.institution || "—"}
          </span>
        </div>
      </td>

      {/* Track / Sector */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono-tech font-semibold bg-neutral-800/80 border border-neutral-700/50 text-accent">
          {r.track}
        </span>
      </td>

      {/* Payment Status */}
      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onTogglePaid(r)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono-tech font-bold transition-all cursor-pointer ${
            r.paid
              ? "bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/50 shadow-sm shadow-emerald-900/30"
              : "bg-neutral-800/80 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
          }`}
          title={
            r.paid
              ? `Status: PAID ${r.paymentRef ? `(Ref: ${r.paymentRef})` : ""}. Click to revert to Not Paid`
              : "Status: UNPAID. Click to mark paid or add reference"
          }
        >
          <span
            className={`size-1.5 rounded-full ${r.paid ? "bg-emerald-400" : "bg-neutral-500"}`}
          />
          {r.paid ? "PAID" : "UNPAID"}
        </button>
        {r.paymentRef && (
          <div
            className="font-mono-tech text-[9px] text-neutral-400 mt-0.5 max-w-[110px] truncate mx-auto"
            title={`Ref: ${r.paymentRef}`}
          >
            {r.paymentRef}
          </div>
        )}
      </td>

      {/* Check-In Switch */}
      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onToggleCheckIn(r)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono-tech font-bold transition-all ${
            r.checkedIn
              ? "bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 shadow-sm shadow-emerald-900/30"
              : "bg-neutral-800/80 border border-neutral-700 text-neutral-400 hover:text-white"
          }`}
          title="Toggle Check-In (Updates both local & Google Sheets)"
        >
          <span
            className={`size-1.5 rounded-full ${r.checkedIn ? "bg-emerald-400" : "bg-neutral-500"}`}
          />
          {r.checkedIn ? "CHECKED IN" : "PENDING"}
        </button>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectSquad(r)}
            className="h-7 px-2.5 text-[11px] font-mono-tech border-neutral-800 hover:bg-neutral-800 text-neutral-300"
          >
            Details
          </Button>
          <button
            type="button"
            onClick={() => onDeleteSquad(r.id, r.teamName)}
            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
            title="Delete Squad from roster & Google Sheets"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const DEFAULT_ADMIN_PIN = "Zero@123";
const PIN_STORAGE_KEY = "zeroth_admin_pin";
const AUTH_SESSION_KEY = "zeroth_admin_auth";

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
    }
    return false;
  });
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Render stored registrations IMMEDIATELY on load (0ms UI paint, non-blocking)
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    if (typeof window !== "undefined") {
      return getStoredRegistrations();
    }
    return [];
  });
  const [webhookUrl, setWebhookUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return getGoogleSheetsWebhookUrl();
    }
    return DEFAULT_SHEETS_WEBHOOK_URL;
  });
  const [paymentsUrl, setPaymentsUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return getPaymentsWebhookUrl();
    }
    return DEFAULT_PAYMENTS_WEBHOOK_URL;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [checkInFilter, setCheckInFilter] = useState<"all" | "checked" | "unchecked">("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "team" | "id">("newest");

  // Modals
  const [selectedSquad, setSelectedSquad] = useState<Registration | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add form state
  const [newSquad, setNewSquad] = useState({
    teamName: "",
    leaderName: "",
    email: "",
    phone: "",
    institution: "",
    track: TRACKS[0]?.title || "Tsunami & Earthquake Mitigation",
    teamSize: "4",
    brief: "",
  });

  const loadData = useCallback(() => {
    setRegistrations(getStoredRegistrations());
    setWebhookUrl(getGoogleSheetsWebhookUrl());
    setPaymentsUrl(getPaymentsWebhookUrl());
  }, []);

  // Check multi-tab storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("zeroth_registration_updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("zeroth_registration_updated", handleStorageUpdate);
    };
  }, [loadData]);

  const getSavedPin = () => {
    return (
      import.meta.env["VITE_ADMIN_PIN"] ||
      localStorage.getItem(PIN_STORAGE_KEY) ||
      DEFAULT_ADMIN_PIN
    );
  };

  // Manual Sync (can bypass short cache)
  const handleSyncRemote = async (forceFresh = false) => {
    const isFresh = Boolean(forceFresh && typeof forceFresh === "boolean");
    setIsSyncing(true);
    try {
      const res = await fetchRemoteRegistrations(webhookUrl, { forceFresh: isFresh });
      if (res.success && res.data) {
        setRegistrations(res.data);
      } else {
        loadData();
      }
      setLastSyncTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err) {
      console.warn("Sync error:", err);
      loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getSavedPin();
    if (pinInput.trim() === correctPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_SESSION_KEY, "true");
      setPinError(false);
      // Clean stale browser storage on login and sync fresh from Google Sheets
      clearStoredRegistrations();
      setRegistrations([]);
      await handleSyncRemote(true);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    clearStoredRegistrations();
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    setRegistrations([]);
    setPinInput("");
  };

  // Gentle auto-refresh against cached proxy endpoint every 25 seconds
  const handleGentleAutoRefresh = useCallback(async () => {
    if (isSyncing || isAutoRefreshing) return;
    setIsAutoRefreshing(true);
    try {
      const res = await fetchRemoteRegistrations(webhookUrl);
      if (res.success && res.data.length > 0) {
        setRegistrations(res.data);
      }
      setLastSyncTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err) {
      console.warn("Gentle auto-refresh warning:", err);
    } finally {
      setIsAutoRefreshing(false);
    }
  }, [webhookUrl, isSyncing, isAutoRefreshing]);

  // Initial background fetch on mount + interval timer (non-blocking)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch fresh data in background immediately; UI already shows cached registrations
    handleGentleAutoRefresh();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        handleGentleAutoRefresh();
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleGentleAutoRefresh]);

  const handleSelectSquad = useCallback((squad: Registration) => {
    setSelectedSquad(squad);
    setPaymentRefInput(squad.paymentRef || "");
  }, []);

  const handleToggleCheckIn = useCallback((reg: Registration) => {
    const nextCheckIn = !reg.checkedIn;
    const updated: Registration = {
      ...reg,
      checkedIn: nextCheckIn,
      lastLocalEdit: Date.now(),
    };
    // 1. Optimistic instant local update
    saveRegistrationLocally(updated);
    setRegistrations((prev) => prev.map((item) => (item.id === reg.id ? updated : item)));
    setSelectedSquad((curr) => (curr?.id === reg.id ? updated : curr));
    // 2. Sync in background via caching proxy
    syncCheckInToRemote(reg.id, nextCheckIn);
  }, []);

  const handleTogglePaid = useCallback(async (reg: Registration) => {
    if (reg.paid) {
      if (
        !window.confirm(
          `Revert payment status for squad "${reg.teamName}" (${reg.id}) back to NOT PAID?`,
        )
      ) {
        return;
      }
      const updated: Registration = {
        ...reg,
        paid: false,
        paymentRef: undefined,
        lastLocalEdit: Date.now(),
      };
      // 1. Instant local update
      saveRegistrationLocally(updated);
      setRegistrations((prev) => prev.map((item) => (item.id === reg.id ? updated : item)));
      setSelectedSquad((curr) => (curr?.id === reg.id ? updated : curr));
      setPaymentRefInput("");
      // 2. Sync in background via payments proxy
      syncPaymentToRemote(reg.id, reg.email, "", reg.leaderName, reg.teamName, false);
    } else {
      // If currently unpaid, open squad detail modal to enter reference ID or mark paid
      setSelectedSquad(reg);
      setPaymentRefInput(reg.paymentRef || "");
    }
  }, []);

  const handleMarkPaid = async () => {
    if (!selectedSquad) return;
    const trimmedRef = paymentRefInput.trim();
    if (!trimmedRef) return;

    const updated: Registration = {
      ...selectedSquad,
      paid: true,
      paymentRef: trimmedRef,
      lastLocalEdit: Date.now(),
    };

    // 1. Optimistic instant local update
    setSelectedSquad(updated);
    saveRegistrationLocally(updated);
    loadData();

    // 2. Sync in background via payments proxy
    setIsMarkingPaid(true);
    try {
      await syncPaymentToRemote(
        updated.id,
        updated.email,
        trimmedRef,
        updated.leaderName,
        updated.teamName,
        true,
      );
    } catch (err) {
      console.warn("Payment sync error:", err);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!selectedSquad) return;
    if (
      !window.confirm(
        `Revert payment status for squad "${selectedSquad.teamName}" (${selectedSquad.id}) back to NOT PAID?`,
      )
    ) {
      return;
    }

    const updated: Registration = {
      ...selectedSquad,
      paid: false,
      paymentRef: undefined,
      lastLocalEdit: Date.now(),
    };

    // 1. Optimistic instant local update
    setSelectedSquad(updated);
    setPaymentRefInput("");
    saveRegistrationLocally(updated);
    setRegistrations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));

    // 2. Sync in background via payments proxy
    setIsMarkingPaid(true);
    try {
      await syncPaymentToRemote(
        updated.id,
        updated.email,
        "",
        updated.leaderName,
        updated.teamName,
        false,
      );
    } catch (err) {
      console.warn("Payment revert sync error:", err);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDeleteSquad = useCallback((id: string, teamName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete squad "${teamName}" (${id})? This will remove it locally and from Google Sheets.`,
      )
    ) {
      // 1. Instant local deletion
      deleteRegistrationLocally(id);
      setRegistrations((prev) => prev.filter((item) => item.id !== id));
      setSelectedSquad((curr) => (curr?.id === id ? null : curr));
      // 2. Sync deletion to Google Sheets
      syncDeleteToRemote(id);
    }
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueNum = Math.floor(100000 + Math.random() * 900000);
    const reg: Registration = {
      ...newSquad,
      id: `ZH-${uniqueNum}`,
      timestamp: new Date().toISOString(),
      status: "confirmed",
      checkedIn: true,
      source: "local",
      syncedToRemote: false,
    };
    saveRegistrationLocally(reg);
    loadData();
    setShowAddModal(false);
    setNewSquad({
      teamName: "",
      leaderName: "",
      email: "",
      phone: "",
      institution: "",
      track: TRACKS[0]?.title || "Tsunami & Earthquake Mitigation",
      teamSize: "4",
      brief: "",
    });
  };

  const handleExport = () => {
    try {
      exportRegistrationsToCsv(filteredRegistrations);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export");
    }
  };

  // Filter & Search Logic
  const filteredRegistrations = useMemo(() => {
    return registrations
      .filter((r) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            r.teamName?.toLowerCase().includes(q) ||
            r.leaderName?.toLowerCase().includes(q) ||
            r.id?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.phone?.toLowerCase().includes(q) ||
            r.institution?.toLowerCase().includes(q) ||
            r.track?.toLowerCase().includes(q) ||
            r.paymentRef?.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Sector filter
        if (selectedTrack !== "all" && r.track !== selectedTrack) {
          return false;
        }

        // Checkin filter
        if (checkInFilter === "checked" && !r.checkedIn) return false;
        if (checkInFilter === "unchecked" && r.checkedIn) return false;

        // Paid filter
        if (paidFilter === "paid" && !r.paid) return false;
        if (paidFilter === "unpaid" && r.paid) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        if (sortBy === "team") {
          return (a.teamName || "").localeCompare(b.teamName || "");
        }
        if (sortBy === "id") {
          return (a.id || "").localeCompare(b.id || "");
        }
        return 0;
      });
  }, [registrations, searchQuery, selectedTrack, checkInFilter, paidFilter, sortBy]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalSquads = registrations.length;
    const totalOperatives = registrations.reduce((acc, r) => acc + (parseInt(r.teamSize) || 1), 0);
    const checkedInCount = registrations.filter((r) => r.checkedIn).length;
    const paidCount = registrations.filter((r) => r.paid).length;
    const trackCounts: Record<string, number> = {};
    TRACKS.forEach((t) => {
      trackCounts[t.title] = 0;
    });
    registrations.forEach((r) => {
      const curr = trackCounts[r.track] ?? 0;
      trackCounts[r.track] = curr + 1;
    });

    return { totalSquads, totalOperatives, checkedInCount, paidCount, trackCounts };
  }, [registrations]);

  // 🔒 Passcode Security Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="size-12 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto mb-4">
            <Lock className="size-6 text-primary" />
          </div>

          <span className="font-mono-tech text-[10px] tracking-[0.25em] text-primary font-bold uppercase">
            RESTRICTED ACCESS
          </span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white mt-1">
            Admin Command Center
          </h1>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            Enter the organizer security passcode to access participant rosters, live stats, and
            sync settings.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 mt-6 text-left">
            <div className="space-y-1.5">
              <label className="font-mono-tech text-[10px] tracking-wider text-neutral-400 flex items-center gap-1.5 font-semibold">
                <KeyRound className="size-3 text-accent" />
                SECURITY PASSCODE
              </label>
              <input
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter passcode..."
                className="w-full border border-neutral-800 bg-neutral-950 px-4 py-3 rounded-lg text-sm text-white outline-none font-mono-tech tracking-widest text-center focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>

            {pinError && (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 p-3 text-red-300 font-mono-tech text-xs rounded-lg">
                <AlertTriangle className="size-4 shrink-0 text-red-400" />
                ACCESS DENIED: Invalid Security Passcode.
              </div>
            )}

            <Button type="submit" variant="alert" className="w-full h-11 font-semibold text-sm">
              <Unlock className="size-4 mr-2" />
              Authenticate Clearance
            </Button>
          </form>

          <div className="border-t border-neutral-800/80 mt-6 pt-4 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1 font-mono-tech text-xs text-neutral-400 hover:text-white transition-colors"
            >
              ← Return to Main Broadcast
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                  ZEROTH HOUR <span className="text-neutral-500 font-normal">|</span> Command
                  Console
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-tech bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] font-mono-tech text-neutral-400 hidden sm:block">
                Jaya Engineering College · Department of ECE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSyncRemote(true)}
              disabled={isSyncing}
              className="h-9 font-mono-tech text-xs border-neutral-800 hover:bg-neutral-900 text-neutral-200"
            >
              <RefreshCw
                className={`size-3.5 mr-1.5 ${isSyncing ? "animate-spin text-primary" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Live"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="h-9 font-mono-tech text-xs border-neutral-800 hover:bg-neutral-900 text-neutral-200"
            >
              <Plus className="size-3.5 mr-1.5 text-accent" />
              Add Squad
            </Button>

            <Button
              variant="alert"
              size="sm"
              onClick={handleExport}
              disabled={filteredRegistrations.length === 0}
              className="h-9 font-mono-tech text-xs"
            >
              <Download className="size-3.5 mr-1.5" />
              Export CSV ({filteredRegistrations.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              className="h-9 font-mono-tech text-xs border-neutral-800 hover:bg-neutral-900 text-neutral-300"
              title="Google Sheets & Forms Integration"
            >
              <LinkIcon className="size-3.5 mr-1 text-accent" />
              <span className="hidden sm:inline">Google Sync</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-9 font-mono-tech text-xs border-red-900/40 text-red-400 hover:bg-red-950/40 hover:border-red-800"
              title="Lock Console"
            >
              <Lock className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[11px] text-neutral-400 tracking-wider font-semibold">
                TOTAL SQUADS
              </span>
              <Users className="size-5 text-primary/70" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-white mt-2">
              {metrics.totalSquads}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono-tech">Registered Teams</p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[11px] text-neutral-400 tracking-wider font-semibold">
                TOTAL MEMBERS
              </span>
              <Users className="size-5 text-accent/70" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-accent mt-2">
              {metrics.totalOperatives}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono-tech">
              Participants across squads
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[11px] text-neutral-400 tracking-wider font-semibold">
                CHECKED-IN SQUADS
              </span>
              <CheckCircle2 className="size-5 text-emerald-400/70" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
              {metrics.checkedInCount}{" "}
              <span className="text-sm font-normal text-neutral-500 font-sans">
                / {metrics.totalSquads}
              </span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono-tech">
              {metrics.totalSquads > 0
                ? Math.round((metrics.checkedInCount / metrics.totalSquads) * 100)
                : 0}
              % attendance verified
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[11px] text-neutral-400 tracking-wider font-semibold">
                PAID SQUADS
              </span>
              <CreditCard className="size-5 text-accent/70" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-accent mt-2">
              {metrics.paidCount}{" "}
              <span className="text-sm font-normal text-neutral-500 font-sans">
                / {metrics.totalSquads}
              </span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono-tech">
              {metrics.totalSquads > 0
                ? Math.round((metrics.paidCount / metrics.totalSquads) * 100)
                : 0}
              % fees reconciled
            </p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[11px] text-neutral-400 tracking-wider font-semibold">
                CLOUD CACHE & BACKUP
              </span>
              <Database className="size-5 text-neutral-400" />
            </div>
            <p className="font-mono-tech text-sm font-bold text-white mt-2 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" />
              {isAutoRefreshing ? "Syncing proxy..." : "Proxy Cache Active"}
            </p>
            <a
              href={BACKUP_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent hover:underline mt-1 font-mono-tech flex items-center gap-1 truncate block"
            >
              Open Google Form Backup <ExternalLink className="size-2.5 inline" />
            </a>
          </div>
        </div>

        {/* Sector Quick Pills */}
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono-tech text-xs text-neutral-400 font-semibold flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              SECTOR BREAKDOWN
            </span>
            {selectedTrack !== "all" && (
              <button
                onClick={() => setSelectedTrack("all")}
                className="text-xs font-mono-tech text-accent hover:underline"
              >
                Clear sector filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTrack("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
                selectedTrack === "all"
                  ? "bg-primary text-white font-bold shadow-md shadow-primary/20"
                  : "bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              All Sectors ({metrics.totalSquads})
            </button>
            {TRACKS.map((t) => {
              const count = metrics.trackCounts[t.title] || 0;
              const isActive = selectedTrack === t.title;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrack(isActive ? "all" : t.title)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-accent text-neutral-950 font-bold shadow-md shadow-accent/20"
                      : "bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <span className="truncate max-w-[140px] sm:max-w-none">{t.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${isActive ? "bg-neutral-950 text-accent font-bold" : "bg-neutral-700/60 text-neutral-300"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by squad, leader, ID, email, college..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all font-mono-tech"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={checkInFilter}
              onChange={(e) => setCheckInFilter(e.target.value as "all" | "checked" | "unchecked")}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-neutral-300 outline-none focus:border-primary"
            >
              <option value="all">All Check-in Status</option>
              <option value="checked">Checked-In Only</option>
              <option value="unchecked">Not Checked-In</option>
            </select>

            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value as "all" | "paid" | "unpaid")}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-neutral-300 outline-none focus:border-primary"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "team" | "id")}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-neutral-300 outline-none focus:border-primary"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="team">Sort: Team Name</option>
              <option value="id">Sort: Pass ID</option>
            </select>
          </div>
        </div>

        {/* Squads Data Table */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Enlisted Squads Roster
              </h2>
              <span className="text-xs font-mono-tech text-neutral-400">
                ({filteredRegistrations.length} of {registrations.length} squads)
              </span>
            </div>
            <div className="text-xs font-mono-tech text-neutral-400 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Live Sync</span>
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="size-12 rounded-full bg-neutral-800/80 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                <Users className="size-6" />
              </div>
              <p className="font-mono-tech text-sm text-neutral-300 font-semibold">
                NO MATCHING SQUADS FOUND
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {registrations.length === 0
                  ? "No registrations entered yet. When students register on the website, they will immediately appear here."
                  : "Try clearing your search query or adjusting your filters."}
              </p>
              {registrations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTrack("all");
                    setCheckInFilter("all");
                    setPaidFilter("all");
                  }}
                  className="mt-4 font-mono-tech text-xs"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/90 font-mono-tech text-neutral-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Pass ID</th>
                    <th className="py-3 px-4 font-semibold">Squad Name</th>
                    <th className="py-3 px-4 font-semibold">Leader & Contact</th>
                    <th className="py-3 px-4 font-semibold">Institution / College</th>
                    <th className="py-3 px-4 font-semibold">Sector</th>
                    <th className="py-3 px-4 font-semibold text-center">Payment</th>
                    <th className="py-3 px-4 font-semibold text-center">Check-In</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {filteredRegistrations.map((r) => (
                    <RegistrationRow
                      key={r.id}
                      registration={r}
                      isCopied={copiedId === r.id}
                      onSelectSquad={handleSelectSquad}
                      onCopy={handleCopy}
                      onToggleCheckIn={handleToggleCheckIn}
                      onTogglePaid={handleTogglePaid}
                      onDeleteSquad={handleDeleteSquad}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Squad Detail Modal ── */}
      {selectedSquad && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedSquad(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3 sm:pb-4">
              <div className="min-w-0 pr-2">
                <span className="font-mono-tech text-[10px] tracking-widest text-primary font-bold">
                  SQUAD CLEARANCE DOSSIER
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5 break-words">
                  {selectedSquad.teamName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="font-mono-tech text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {selectedSquad.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold ${
                      selectedSquad.paid
                        ? "bg-emerald-950/80 border border-emerald-600/60 text-emerald-300"
                        : "bg-neutral-800/80 border border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${selectedSquad.paid ? "bg-emerald-400" : "bg-neutral-500"}`}
                    />
                    {selectedSquad.paid ? "PAID" : "UNPAID"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold ${
                      selectedSquad.checkedIn
                        ? "bg-emerald-950/80 border border-emerald-600/60 text-emerald-300"
                        : "bg-neutral-800/80 border border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${selectedSquad.checkedIn ? "bg-emerald-400" : "bg-neutral-500"}`}
                    />
                    {selectedSquad.checkedIn ? "CHECKED IN" : "PENDING CHECK-IN"}
                  </span>
                  <span className="text-xs font-mono-tech text-neutral-400">
                    {new Date(selectedSquad.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSquad(null)}
                className="text-neutral-400 hover:text-white p-1 rounded shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  LEADER NAME
                </p>
                <p className="font-bold text-neutral-200 mt-1 break-words">
                  {selectedSquad.leaderName}
                </p>
              </div>

              <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  SQUAD SIZE
                </p>
                <p className="font-bold text-neutral-200 mt-1">{selectedSquad.teamSize} Members</p>
              </div>

              <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  EMAIL
                </p>
                <a
                  href={`mailto:${selectedSquad.email}`}
                  className="font-mono-tech text-accent hover:underline mt-1 block break-all"
                >
                  {selectedSquad.email || "—"}
                </a>
              </div>

              <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  PHONE
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <a
                    href={`tel:${selectedSquad.phone}`}
                    className="font-mono-tech text-primary hover:underline break-all text-xs shrink-0"
                  >
                    {selectedSquad.phone || "—"}
                  </a>
                  {selectedSquad.phone && (
                    <button
                      type="button"
                      onClick={(e) => handleWhatsAppClick(e, selectedSquad)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono-tech font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 hover:bg-emerald-900/60 hover:text-emerald-300 px-2.5 py-1 rounded transition-colors shrink-0 cursor-pointer"
                      title="Open WhatsApp message template"
                    >
                      <MessageCircle className="size-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  INSTITUTION / COLLEGE
                </p>
                <p className="font-medium text-neutral-200 mt-1 break-words">
                  {selectedSquad.institution || "—"}
                </p>
              </div>

              <div className="col-span-1 sm:col-span-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  ASSIGNED THREAT SECTOR
                </p>
                <p className="font-bold text-accent mt-1 break-words">{selectedSquad.track}</p>
              </div>

              <div className="col-span-1 sm:col-span-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                  PAYMENT REFERENCE ID
                </p>
                <p className="font-mono-tech text-xs mt-1 break-all">
                  {selectedSquad.paymentRef ? (
                    <span className="text-emerald-400 font-bold">{selectedSquad.paymentRef}</span>
                  ) : (
                    <span className="text-neutral-500 italic">No reference ID registered</span>
                  )}
                </p>
              </div>

              {selectedSquad.brief && (
                <div className="col-span-1 sm:col-span-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                  <p className="font-mono-tech text-[10px] text-neutral-500 uppercase font-semibold">
                    MISSION PROTOTYPE BRIEF
                  </p>
                  <div className="mt-1 max-h-36 overflow-y-auto pr-2 rounded overscroll-contain">
                    <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap break-words text-xs">
                      {selectedSquad.brief}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment & Check-In Action Section */}
            <div className="border-t border-neutral-800 pt-3 sm:pt-4 space-y-3">
              <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1.5">
                    <CreditCard className="size-3 text-accent" />
                    PAYMENT CLEARANCE // REFERENCE ID
                  </label>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold ${
                      selectedSquad.paid
                        ? "bg-emerald-950/80 border border-emerald-600/60 text-emerald-300"
                        : "bg-neutral-800/80 border border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${selectedSquad.paid ? "bg-emerald-400" : "bg-neutral-500"}`}
                    />
                    {selectedSquad.paid ? "PAID" : "UNPAID"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder="Enter Payment Reference ID (e.g. UPI / Txn ID)..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-white outline-none focus:border-primary placeholder:text-neutral-500"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="tactical"
                      size="sm"
                      disabled={!paymentRefInput.trim() || isMarkingPaid}
                      onClick={handleMarkPaid}
                      className="h-9 px-3 font-mono-tech text-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMarkingPaid ? (
                        <>
                          <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                          Syncing...
                        </>
                      ) : selectedSquad.paid ? (
                        <>
                          <Check className="size-3.5 mr-1.5 text-emerald-400" />
                          Update Reference
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-3.5 mr-1.5" />
                          Mark Paid
                        </>
                      )}
                    </Button>

                    {selectedSquad.paid && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMarkingPaid}
                        onClick={handleMarkUnpaid}
                        className="h-9 px-3 font-mono-tech text-xs border-red-500/40 text-red-400 hover:bg-red-950/40 hover:border-red-500/70 transition-colors"
                        title="Revert squad payment status back to NOT PAID"
                      >
                        <RotateCcw className="size-3.5 mr-1.5" />
                        Mark as Not Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleCheckIn(selectedSquad)}
                  className={`font-mono-tech text-xs h-9 justify-center ${
                    selectedSquad.checkedIn
                      ? "border-emerald-600 text-emerald-400 hover:bg-emerald-950/30"
                      : "border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  <CheckCircle2 className="size-3.5 mr-1.5 shrink-0" />
                  {selectedSquad.checkedIn ? "Checked In (Click to Undo)" : "Mark as Checked In"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSquad(selectedSquad.id, selectedSquad.teamName)}
                  className="font-mono-tech text-xs h-9 justify-center text-red-400 border-red-900/40 hover:bg-red-950/40 hover:border-red-800"
                >
                  <Trash2 className="size-3.5 mr-1.5 shrink-0" />
                  Delete Squad
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Squad Manual Modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="font-mono-tech text-[10px] tracking-widest text-accent font-bold">
                  MANUAL OVERRIDE
                </span>
                <h3 className="font-display text-lg font-bold text-white">Enroll Squad On-Site</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    SQUAD NAME *
                  </span>
                  <input
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                    value={newSquad.teamName}
                    onChange={(e) => setNewSquad({ ...newSquad, teamName: e.target.value })}
                    placeholder="e.g. Apex Dynamics"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    LEADER NAME *
                  </span>
                  <input
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                    value={newSquad.leaderName}
                    onChange={(e) => setNewSquad({ ...newSquad, leaderName: e.target.value })}
                    placeholder="Full name"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    CONTACT EMAIL *
                  </span>
                  <input
                    required
                    type="email"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                    value={newSquad.email}
                    onChange={(e) => setNewSquad({ ...newSquad, email: e.target.value })}
                    placeholder="operative@email.com"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    MOBILE NUMBER *
                  </span>
                  <input
                    required
                    type="tel"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                    value={newSquad.phone}
                    onChange={(e) => setNewSquad({ ...newSquad, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </label>

                <label className="space-y-1 block col-span-2">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    INSTITUTION / COLLEGE *
                  </span>
                  <input
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                    value={newSquad.institution}
                    onChange={(e) => setNewSquad({ ...newSquad, institution: e.target.value })}
                    placeholder="College Name"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    SECTOR *
                  </span>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary font-mono-tech"
                    value={newSquad.track}
                    onChange={(e) => setNewSquad({ ...newSquad, track: e.target.value })}
                  >
                    {TRACKS.map((t) => (
                      <option key={t.id} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                    TEAM SIZE *
                  </span>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary font-mono-tech"
                    value={newSquad.teamSize}
                    onChange={(e) => setNewSquad({ ...newSquad, teamSize: e.target.value })}
                  >
                    {["1", "2", "3", "4"].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === "1" ? "Member (Solo)" : "Members"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                  PROJECT BRIEF (OPTIONAL)
                </span>
                <textarea
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  value={newSquad.brief}
                  onChange={(e) => setNewSquad({ ...newSquad, brief: e.target.value })}
                  placeholder="Prototype description..."
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="alert" size="sm">
                  Enroll & Check-in Squad
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Google Sheets & Form Integration Modal ── */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="font-mono-tech text-[10px] tracking-widest text-primary font-bold">
                  INTEGRATION HUB
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  Google Sheets & Forms Real-time Sync
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Direct Form Link Alert */}
              <div className="bg-accent/10 border border-accent/30 p-3.5 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono-tech font-bold text-accent text-xs">
                    OFFICIAL BACKUP GOOGLE FORM
                  </p>
                  <p className="text-neutral-300 text-[11px] mt-0.5">
                    If cloud sync is slow during high traffic, users are automatically directed
                    here:
                  </p>
                </div>
                <Button variant="tactical" size="sm" className="shrink-0" asChild>
                  <a href={BACKUP_GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1" /> Open Form
                  </a>
                </Button>
              </div>

              {/* Webhook URL configuration */}
              <div className="space-y-1.5">
                <label className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold">
                  GOOGLE APPS SCRIPT WEB APP URL (REGISTRATIONS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-white outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    variant="tactical"
                    onClick={() => {
                      setGoogleSheetsWebhookUrl(webhookUrl);
                      alert("Registrations webhook URL saved successfully!");
                    }}
                  >
                    Save URL
                  </Button>
                </div>
              </div>

              {/* Comms / Payments Webhook URL configuration */}
              <div className="space-y-1.5">
                <label className="font-mono-tech text-[10px] text-neutral-400 uppercase font-semibold flex items-center justify-between">
                  <span>COMMS & PAYMENTS AUTOMATION WEB APP URL</span>
                  <span className="text-[9px] text-emerald-400 font-normal">
                    ADDITIVE · NEVER TOUCHES MAIN SHEET
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={paymentsUrl}
                    onChange={(e) => setPaymentsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono-tech text-white outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    variant="tactical"
                    onClick={() => {
                      setPaymentsWebhookUrl(paymentsUrl);
                      alert("Comms / Payments Webhook URL saved successfully!");
                    }}
                  >
                    Save URL
                  </Button>
                </div>
              </div>

              <div className="bg-neutral-950/80 p-4 rounded-lg border border-neutral-800 space-y-3">
                <p className="font-mono-tech font-bold text-accent text-xs">
                  ⚡ Complete Google Apps Script (Supports Inserts, Check-in Sync & Deletions)
                </p>
                <p className="text-neutral-400 leading-relaxed">
                  Paste the code below in your Google Sheet's{" "}
                  <strong>Extensions &gt; Apps Script</strong> and deploy as a Web App (Access:{" "}
                  <em>Anyone</em>). It handles registration writes, check-in updates, deletions, and
                  live data retrieval:
                </p>
                <pre className="bg-black p-3 rounded font-mono-tech text-[11px] overflow-x-auto text-emerald-400 border border-neutral-800 leading-relaxed max-h-60 overflow-y-auto">
                  {`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // 1. Update Check-in
    if (data.action === "updateCheckIn") {
      var values = sheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(data.id)) {
          sheet.getRange(i + 1, 11).setValue(data.checkedIn ? "YES" : "NO");
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Delete row
    if (data.action === "delete") {
      var values = sheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(data.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. New Registration
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Pass ID", "Team Name", "Leader Name", "Email", "Mobile Number", "Institution", "Threat Sector", "Squad Size", "Mission Brief", "Registered At", "Checked In"]);
    }
    sheet.appendRow([
      data.id || "",
      data.teamName || "",
      data.leaderName || "",
      data.email || "",
      data.phone || "",
      data.institution || "",
      data.track || "",
      data.teamSize || "4",
      data.brief || "",
      data.timestamp ? new Date(data.timestamp).toLocaleString("en-GB") : new Date().toLocaleString("en-GB"),
      data.checkedIn ? "YES" : "NO"
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success", id: data.id }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    result.push({
      id: String(row[0]),
      teamName: String(row[1] || ""),
      leaderName: String(row[2] || ""),
      email: String(row[3] || ""),
      phone: String(row[4] || ""),
      institution: String(row[5] || ""),
      track: String(row[6] || ""),
      teamSize: String(row[7] || "4"),
      brief: String(row[8] || ""),
      timestamp: String(row[9] || ""),
      checkedIn: String(row[10] || "").toUpperCase() === "YES"
    });
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
