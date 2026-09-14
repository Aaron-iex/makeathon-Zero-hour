import fs from 'fs';
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const targetAutoRefresh = `  // Gentle auto-refresh against cached proxy endpoint every 25 seconds
  const handleGentleAutoRefresh = useCallback(async () => {
    if (isSyncingRef.current || isAutoRefreshingRef.current) return;
    isAutoRefreshingRef.current = true;
    setIsAutoRefreshing(true);
    try {
      const res = await fetchRemoteRegistrations(webhookUrl);
      if (res.success && res.data) {
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
      isAutoRefreshingRef.current = false;
      setIsAutoRefreshing(false);
    }
  }, [webhookUrl]);

  // Initial background fetch on mount + interval timer (non-blocking)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch fresh data in background immediately; UI already shows cached registrations
    handleGentleAutoRefresh();`;
    
const newAutoRefresh = `  // Initial fetch from proxy (which calls Supabase, falls back to Sheets)
  const fetchRegistrations = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const token = sessionStorage.getItem("zeroth_admin_token");
      const res = await fetch("/api/registrations", {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const data = await res.json();
      setRegistrations(data);
      
      // Store stale fallback
      try { sessionStorage.setItem("zeroth_registrations_cache", JSON.stringify(data)); } catch (e) {}
      
      setLastSyncTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err) {
      console.warn("Fetch failed, falling back to local storage", err);
      const fallback = getStoredRegistrations();
      if (fallback.length > 0) setRegistrations(fallback);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Sync Live button alias
  const handleSyncRemote = useCallback(async () => {
    await fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchRegistrations();`;

if (code.includes(targetAutoRefresh)) {
  code = code.replace(targetAutoRefresh, newAutoRefresh);
}

// Fix useEffect dependencies
code = code.replace(
  `    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [isAuthenticated, handleGentleAutoRefresh]);`,
  `    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [isAuthenticated, fetchRegistrations]);`
);

// We also need to remove the OLD handleSyncRemote
const oldSyncTarget = `  const handleSyncRemote = useCallback(
    async (forceFresh = false) => {
      const isFresh = Boolean(forceFresh && typeof forceFresh === "boolean");
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
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
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [webhookUrl],
  );`;

if (code.includes(oldSyncTarget)) {
  code = code.replace(oldSyncTarget, "");
}

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched admin.tsx phase 2!");
