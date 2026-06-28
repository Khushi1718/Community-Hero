const http = require('http');

const data = JSON.stringify({
  status: "Ready For Verification",
  actorName: "Sushil",
  actorRole: "employee",
  eventName: "Submit for Verification",
  progressPercentage: 85,
  resolutionProof: {
    imageBase64: "https://res.cloudinary.com/dpv0ukspz/image/upload/v1/community_hero/r54gfqk0zndb12s2a849.jpg",
    notes: "Completed work",
    timeTaken: "N/A",
    materialUsed: "N/A"
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/issues/CH-2026-1076',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
