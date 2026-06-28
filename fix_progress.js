const fs = require('fs');
const mongoose = require('mongoose');

async function fixProgress() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const uriMatch = envFile.match(/MONGODB_URI=["']?(.*?)["']?(\n|$)/);
  if (!uriMatch) {
    console.error("No MONGODB_URI found.");
    return;
  }
  
  await mongoose.connect(uriMatch[1].trim());
  console.log("Connected to MongoDB.");
  
  const Issue = mongoose.models.Issue || mongoose.model('Issue', new mongoose.Schema({}, { strict: false }));
  
  const result = await Issue.updateMany(
    { status: "Awaiting Citizen Review", progressPercentage: 95 },
    { $set: { progressPercentage: 100 } }
  );
  
  console.log(`Updated ${result.modifiedCount} issues to 100% progress.`);
  
  await mongoose.disconnect();
}

fixProgress();
