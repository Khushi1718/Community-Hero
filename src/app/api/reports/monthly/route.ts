import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { User } from "@/models/User";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Check permissions
    const role = request.headers.get("x-user-role");
    if (role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Gather global stats
    const [totalIssues, resolvedIssues, totalUsers, totalDrives, totalOrgs] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: "resolved" }),
      User.countDocuments(),
      VolunteerDrive.countDocuments(),
      VolunteerOrganization.countDocuments(),
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert civic administration analyst. Write a professional, highly formal Monthly Impact Report for a government dashboard based on the following global statistics:
    - Total Issues Reported: ${totalIssues}
    - Total Issues Resolved: ${resolvedIssues}
    - Total Registered Citizens: ${totalUsers}
    - Total Community Drives: ${totalDrives}
    - Total Volunteer Organizations: ${totalOrgs}

    Format the report in markdown. Use clear headings, bullet points, and a very official, governmental tone. Include an Executive Summary, Key Metrics, Operational Insights, and Recommendations. DO NOT include any fake dates or external links, just focus on interpreting these numbers as a measure of civic engagement and municipal responsiveness. Make it look like an official state document.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error("AI Report error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
