import mongoose from "mongoose";
import { VolunteerDrive } from "./src/models/VolunteerDrive";
import { Certificate } from "./src/models/Certificate";
import { initiateCertificateGeneration } from "./src/lib/certificates";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");
    const drive = await VolunteerDrive.findOne({ title: "clean up the roads" }).lean();
    if (!drive) {
      console.log("Drive not found");
      process.exit(0);
    }
    console.log("Found drive:", drive.title);
    
    // We pass it to initiateCertificateGeneration
    await initiateCertificateGeneration(drive);
    console.log("Done initiateCertificateGeneration");

    // Also check what failed in the DB
    const failedCerts = await Certificate.find({ status: "Failed" }).sort({ createdAt: -1 }).limit(1).lean();
    if (failedCerts.length > 0) {
      console.log("LATEST FAILED CERTIFICATE ERROR LOG:");
      console.log(failedCerts[0].errorLog);
    }
    
  } catch (err) {
    console.error("Caught Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

test();
