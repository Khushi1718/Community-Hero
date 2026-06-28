const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Issue = require('./src/models/Issue').Issue;
  const issues = await Issue.find({ status: "Awaiting Admin Verification" }).sort({ createdAt: -1 }).limit(3);
  for (let i of issues) {
    console.log(`Issue ${i.issueId}:`);
    console.log(`  has resolutionProof: ${!!i.resolutionProof}`);
    console.log(`  has resolutionVerification: ${!!i.resolutionVerification?.reasoning}`);
  }
  process.exit(0);
}
check();
