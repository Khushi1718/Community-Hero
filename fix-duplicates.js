const mongoose = require('mongoose');
const fs = require('fs');

fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
});

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const Issue = mongoose.models.Issue || mongoose.model('Issue', new mongoose.Schema({}, { strict: false }));
    
    const issues = await Issue.find({
      title: "Broken Streetlight",
      assignedToName: "vansh1"
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${issues.length} Broken Streetlight issues assigned to vansh1.`);
    
    if (issues.length > 1) {
      const toDelete = issues.slice(0, issues.length - 1);
      const deleteIds = toDelete.map(i => i._id);
      
      const result = await Issue.deleteMany({ _id: { $in: deleteIds } });
      console.log(`Deleted ${result.deletedCount} duplicate issues.`);
      
      const TimelineEvent = mongoose.models.TimelineEvent || mongoose.model('TimelineEvent', new mongoose.Schema({}, { strict: false }));
      const tlResult = await TimelineEvent.deleteMany({ issueId: { $in: deleteIds } });
      console.log(`Deleted ${tlResult.deletedCount} orphaned timeline events.`);
    } else {
      console.log("No cleanup needed.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}
run();
