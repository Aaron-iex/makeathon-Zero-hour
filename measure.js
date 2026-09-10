const start1 = Date.now();
fetch("http://localhost:3000/api/registrations?fresh=1", { headers: { Authorization: "Bearer zeroth-secure-token-xyz-987" } }).then(() => {
  console.log("Miss:", Date.now() - start1, "ms");
  const start2 = Date.now();
  fetch("http://localhost:3000/api/registrations", { headers: { Authorization: "Bearer zeroth-secure-token-xyz-987" } }).then(() => {
    console.log("Hit:", Date.now() - start2, "ms");
    process.exit(0);
  }).catch(() => process.exit(1));
}).catch(() => process.exit(1));
