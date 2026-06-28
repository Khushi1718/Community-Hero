async function run() {
  try {
    const finalIssue = {
      description: "Test issue 123",
      citizenEmail: "test@example.com",
      location: "28.6139,77.2090",
      aiAnalysis: { category: "Broken Streetlight", severity: "High" },
      isDuplicateOf: "667c2f0f9b6c8a001c8e9d9e",
      duplicateStatus: "Overridden"
    };

    const res = await fetch("http://localhost:3000/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalIssue)
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error(err);
  }
}
run();
