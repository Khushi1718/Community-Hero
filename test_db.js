const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const Issue = mongoose.models.Issue || mongoose.model("Issue", new mongoose.Schema({}, { strict: false }));
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  
  const lastIssue = await Issue.findOne({}).sort({ createdAt: -1 });
  console.log("LAST ISSUE:", JSON.stringify(lastIssue, null, 2));
  
  const users = await User.find({ role: { $in: ["admin", "employee"] } });
  console.log("STAFF USERS:", JSON.stringify(users, null, 2));
  
  process.exit(0);
}
check().catch(console.error);
