import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const department = searchParams.get("department");
    
    let matchStage: any = {};
    if (state) matchStage["location.state"] = state;
    if (city) matchStage["location.city"] = city;
    if (department) matchStage.assignedDepartment = department;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const stats = await Issue.aggregate([
      { $match: matchStage },
      { 
        $facet: {
          open: [
            { $match: { status: { $in: ["Reported", "Verified", "Open"] } } },
            { $count: "count" }
          ],
          resolved: [
            { $match: { status: { $in: ["Closed", "Resolved", "Awaiting Citizen Review"] } } },
            { $count: "count" }
          ],
          escalated: [
            { $match: { 
                createdAt: { $lt: sevenDaysAgo },
                status: { $nin: ["Closed", "Resolved", "Rejected", "Awaiting Citizen Review"] }
            }},
            { $count: "count" }
          ],
          inProgress: [
             { $match: { status: { $in: ["Assigned", "In Progress", "Site Visit Scheduled", "Employee Reached Site", "Inspection Started", "Inspection Completed", "Work Started", "Work In Progress", "Work Completed"] } } },
             { $count: "count" }
          ]
        }
      }
    ]);

    const result = {
      open: stats[0].open[0]?.count || 0,
      resolved: stats[0].resolved[0]?.count || 0,
      escalated: stats[0].escalated[0]?.count || 0,
      inProgress: stats[0].inProgress[0]?.count || 0,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
