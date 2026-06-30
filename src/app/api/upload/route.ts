import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpv0ukspz",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: "community_hero/drives",
    });

    return NextResponse.json({ url: uploadResponse.secure_url });
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
