import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";

// Use Gemini 1.5 Flash for fast generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Fetch real statistics from DB
    // In a real app we might filter by the last month, but for this demo we'll use totals
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: { $in: ["Resolved", "Closed"] } });
    const totalOrgs = await VolunteerOrganization.countDocuments();
    
    // Some basic aggregations to give AI more context
    const issuesByDept = await Issue.aggregate([
      { $group: { _id: "$assignedDepartment", count: { $sum: 1 } } }
    ]);

    const contextData = {
      totalIssues,
      resolvedIssues,
      resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) + "%" : "0%",
      totalVolunteerOrganizations: totalOrgs,
      departmentBreakdown: issuesByDept.map(d => `${d._id || 'Unassigned'}: ${d.count}`).join(', ')
    };

    // 2. Define the exact JSON structure we want back from Gemini
    const responseSchema: any = {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "A catchy title for the monthly report (e.g., 'Monthly Impact & Health Summary')"
        },
        highlights: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING
          },
          description: "3 short bullet points summarizing positive highlights based on the data."
        },
        recommendations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING
          },
          description: "2 short actionable recommendations for the super admin based on the department breakdown or resolution rate."
        }
      },
      required: ["title", "highlights", "recommendations"]
    };

    // 3. Prompt Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const prompt = `You are an AI assistant analyzing civic engagement data for Community Hero.
    Generate a brief monthly impact report for the Super Admin dashboard based on the following real-time data:
    
    Total Issues Reported: ${contextData.totalIssues}
    Total Resolved: ${contextData.resolvedIssues} (${contextData.resolutionRate})
    Total Verified Volunteer Organizations: ${contextData.totalVolunteerOrganizations}
    Department Breakdown: ${contextData.departmentBreakdown}
    
    Write 3 highlights and 2 recommendations in a professional, encouraging tone.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const aiData = JSON.parse(responseText);

    // Add current date before sending back
    aiData.date = new Date().toLocaleDateString();

    return NextResponse.json(aiData);
  } catch (error: any) {
    console.error("Failed to generate AI report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
