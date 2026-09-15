import fs from 'fs';

let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

// 1. Add state
code = code.replace(
  'const [searchQuery, setSearchQuery] = useState("");',
  `const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);`
);

// 2. Use debouncedSearchQuery in filteredRegistrations
code = code.replace(
  /if \(searchQuery\.trim\(\)\) \{/g,
  `if (debouncedSearchQuery.trim()) {`
);
code = code.replace(
  /const q = searchQuery\.toLowerCase\(\);/g,
  `const q = debouncedSearchQuery.toLowerCase();`
);
code = code.replace(
  /\[registrations, searchQuery, selectedTrack, checkInFilter, paidFilter, sortBy\]/g,
  `[registrations, debouncedSearchQuery, selectedTrack, checkInFilter, paidFilter, sortBy]`
);

fs.writeFileSync('src/routes/admin.tsx', code);
console.log("Patched search debounce");
