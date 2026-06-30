const mongoose = require('mongoose');
const uri = "mongodb+srv://khushinain78_db_user:jocRoeDsQLdA1WYl@cluster0.aus4ili.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const logs = await mongoose.connection.collection('auditlogs').find({}).toArray();
  console.log("All logs:", logs);
  process.exit(0);
}
run().catch(console.error);
