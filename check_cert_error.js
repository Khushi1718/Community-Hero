const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const cert = await db.collection('certificates').find({ status: 'Failed' }).sort({ _id: -1 }).limit(1).toArray();
  if (cert.length > 0) {
    console.log("Error Log:", cert[0].errorLog);
  } else {
    console.log("No failed certificates found.");
  }
  await client.close();
}
check();
