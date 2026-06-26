import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { User } from "@/models/User";
import { PointTransaction } from "@/models/PointTransaction";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const user = await User.findOne({ email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const transactions = await PointTransaction.find({ targetId: email, targetType: "citizen" }).sort({ createdAt: -1 }).lean();
    
    // Group transactions by month for chart
    const monthlyPoints = [
      { name: "Jan", points: 0 },
      { name: "Feb", points: 0 },
      { name: "Mar", points: 0 },
      { name: "Apr", points: 0 },
      { name: "May", points: user.communityInfo?.points || 0 }
    ];

    return NextResponse.json({
      hours: user.communityInfo?.volunteerHours || 0,
      drives: user.communityInfo?.completedDrives || 0,
      points: user.communityInfo?.points || 0,
      organizationsJoined: user.communityInfo?.organizationsJoined || 0,
      monthlyPoints,
      transactions: transactions.slice(0, 10)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
