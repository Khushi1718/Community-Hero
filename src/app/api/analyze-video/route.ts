import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ─── Per-frame result from Gemini ─────────────────────────────────────────────
interface FrameResult {
  frameIndex: number;
  issueDetected: boolean;
  category: string;
  confidence: number;
  severity: string;
  description: string;
}

// ─── Final aggregated output ──────────────────────────────────────────────────
interface VideoAnalysisResult {
  issueType: string;
  confidence: number;
  severity: string;
  summary: string;
  visibleFrames: number;
  totalFrames: number;
  recommendation: string;
  department: string;
  frameResults: FrameResult[];
  trust: {
    status: "Verified" | "Needs Review" | "Suspicious";
    verificationScore: number;
    checks: {
      hasGPS: boolean;
      isFresh: boolean;
      confidenceScore: number;
      consistencyScore: number;
      metadataIntegrity: boolean;
      cameraSource: string;
    }
  };
  userFeedback: string[];
}

// ─── Low-confidence user feedback ────────────────────────────────────────────
const generateFeedback = (confidence: number, visibleFrames: number, totalFrames: number, category: string): string[] => {
  const tips: string[] = [];
  const ratio = visibleFrames / totalFrames;

  if (confidence < 50) {
    tips.push("The issue is not clearly visible. Please move closer to the problem area.");
    tips.push("Lighting is insufficient. Try capturing in better lighting conditions.");
  }
  if (ratio < 0.5 && category !== "No Significant Civic Issue") {
    tips.push(`The reported issue only appeared in ${visibleFrames} of ${totalFrames} frames. For higher confidence, record for a few more seconds while keeping the camera steady.`);
  }
  if (category === "No Significant Civic Issue") {
    tips.push("Our AI could not detect any civic issue in the video. Please ensure you are recording the correct area.");
    tips.push("Try recording from a different angle or moving closer to the issue.");
  }

  return tips;
};

// ─── Aggregate frame results ──────────────────────────────────────────────────
const aggregateResults = (frames: FrameResult[], totalFrames: number): Pick<VideoAnalysisResult, "issueType" | "confidence" | "severity" | "visibleFrames" | "recommendation" | "department"> => {
  const issueFrames = frames.filter(f => f.issueDetected && f.category !== "No Significant Civic Issue");
  const visibleFrames = issueFrames.length;

  if (visibleFrames === 0) {
    return {
      issueType: "No Significant Civic Issue",
      confidence: Math.round(frames.reduce((s, f) => s + f.confidence, 0) / frames.length) || 50,
      severity: "Low",
      visibleFrames: 0,
      recommendation: "Unable to detect a significant civic issue. Please record again from a different angle.",
      department: "Miscellaneous",
    };
  }

  // Majority category wins
  const categoryCounts: Record<string, number> = {};
  for (const f of issueFrames) {
    categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
  }
  const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Weighted confidence: higher if issue is present consistently across frames
  const consistencyBonus = Math.round((visibleFrames / totalFrames) * 20);
  const avgFrameConfidence = Math.round(issueFrames.reduce((s, f) => s + f.confidence, 0) / issueFrames.length);
  const finalConfidence = Math.min(98, avgFrameConfidence + consistencyBonus);

  // Severity: pick highest
  const severityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const dominantSeverity = issueFrames
    .map(f => f.severity)
    .sort((a, b) => (severityOrder[b] || 0) - (severityOrder[a] || 0))[0];

  const deptMap: Record<string, string> = {
    "Pothole": "Roads Department",
    "Road Damage": "Roads Department",
    "Damaged Footpath": "Roads Department",
    "Water Leakage": "Water Department",
    "Waterlogging": "Water Department",
    "Sewage Overflow": "Water Department",
    "Blocked Drain": "Water Department",
    "Garbage Dump": "Sanitation Department",
    "Overflowing Dustbin": "Sanitation Department",
    "Illegal Dumping": "Sanitation Department",
    "Broken Streetlight": "Electricity Department",
    "Electrical Hazard": "Electricity Department",
    "Traffic Signal Damage": "Traffic Police",
    "Fallen Tree": "Parks Department",
    "Park Maintenance Issue": "Parks Department",
    "Stray Animal": "Animal Control",
    "Open Manhole": "Municipal Committee",
    "Broken Public Property": "Municipal Committee",
    "Encroachment": "Municipal Committee",
    "Public Toilet Issue": "Sanitation Department",
  };

  return {
    issueType: dominantCategory,
    confidence: finalConfidence,
    severity: dominantSeverity,
    visibleFrames,
    recommendation: `Assign to ${deptMap[dominantCategory] || "Miscellaneous"} — ${dominantSeverity} priority.`,
    department: deptMap[dominantCategory] || "Miscellaneous",
  };
};

// ─── Trust Engine ─────────────────────────────────────────────────────────────
const evaluateVideoTrust = (
  hasGPS: boolean,
  timestamp: number | undefined,
  confidence: number,
  visibleFrames: number,
  totalFrames: number,
  cameraSource: string
) => {
  const isFresh = !!timestamp && (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
  const consistencyScore = Math.round((visibleFrames / Math.max(totalFrames, 1)) * 100);
  const isLevel1 = cameraSource === "Level 1 (In-App)";

  let score = 0;
  score += confidence * 0.35;
  score += hasGPS ? 20 : 0;
  score += isLevel1 ? 20 : 5;
  score += isFresh ? 10 : 0;
  score += (consistencyScore / 100) * 15;

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    status: (score >= 75 ? "Verified" : score >= 45 ? "Needs Review" : "Suspicious") as "Verified" | "Needs Review" | "Suspicious",
    verificationScore: score,
    checks: {
      hasGPS,
      isFresh,
      confidenceScore: confidence,
      consistencyScore,
      metadataIntegrity: true,
      cameraSource,
    }
  };
};

// ─── Main POST handler ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { frames, description = "", latitude, longitude, timestamp, cameraSource = "Level 1 (In-App)" } = body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: "frames array is required" }, { status: 400 });
    }

    const hasGPS = !!(latitude && longitude);
    const totalFrames = frames.length;

    const apiKey = process.env.GEMINI_API_KEY;

    // ── Mock mode ────────────────────────────────────────────────────────────
    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey === "your_gemini_api_key_here") {
      console.log("[AI Video Analyzer] No valid Gemini API key found. Using fallback logic.");
      const isIssue = description.toLowerCase().includes("water") || description.toLowerCase().includes("garbage") || description.toLowerCase().includes("road");
      
      const mockFrames: FrameResult[] = frames.map((_, i) => ({
        frameIndex: i,
        issueDetected: isIssue,
        category: isIssue ? "Road Damage" : "No Significant Civic Issue",
        confidence: isIssue ? 80 : 40,
        severity: isIssue ? "High" : "Low",
        description: isIssue ? "Issue detected based on description fallback." : "No issue detected due to missing API key and description.",
      }));
      const agg = aggregateResults(mockFrames, totalFrames);
      return NextResponse.json({
        ...agg,
        summary: `Fallback Analysis: ${agg.issueType} detected based on description. Please configure Gemini API key.`,
        totalFrames,
        frameResults: mockFrames,
        trust: evaluateVideoTrust(hasGPS, timestamp, agg.confidence, agg.visibleFrames, totalFrames, cameraSource),
        userFeedback: ["Gemini API key missing. Used basic text analysis instead of vision."],
      });
    }

    console.log(`[AI Video Analyzer] Sending ${frames.length} frames to Gemini. User description: "${description}"`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    const framesToAnalyze = frames.slice(0, 10);
    const frameResults: FrameResult[] = [];

    for (let i = 0; i < framesToAnalyze.length; i++) {
      const frameBase64 = framesToAnalyze[i];
      try {
        const matches = frameBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) continue;

        const prompt = `You are an AI Municipal Inspector analyzing frame ${i + 1} of ${framesToAnalyze.length} from a citizen video report.

Analyze the provided IMAGE frame carefully.

Your task is to identify ONLY visible civic or public infrastructure issues.

Possible issues include:
- Pothole
- Road Damage
- Water Leakage
- Waterlogging
- Garbage Dump
- Overflowing Dustbin
- Broken Streetlight
- Damaged Footpath
- Open Manhole
- Sewage Overflow
- Blocked Drain
- Traffic Signal Damage
- Fallen Tree
- Stray Animal
- Park Maintenance Issue
- Broken Public Property
- Electrical Hazard
- Illegal Dumping
- Encroachment
- Public Toilet Issue
- Other

Rules:
- Base your decision ONLY on visible evidence in THIS frame.
- Never guess.
- Ignore people, vehicles and buildings unless they are directly related to the issue.
- If multiple issues exist, choose the primary issue and list the others.
- If no civic issue is clearly visible in this specific frame, return issueDetected=false.
- If the frame is completely black, blurry, or a transition, return issueDetected=false.

Return ONLY valid JSON.

{
  "issueDetected": true,
  "issueType": "",
  "confidence": 0,
  "severity": "Low | Medium | High | Critical",
  "description": "",
  "evidence": "",
  "secondaryIssues": [],
  "needsHumanReview": false
}

Requirements:
- Confidence must be between 0 and 100.
- Confidence below 60 means uncertain.
- Never output markdown.
- Never output explanations.
- Never invent information.

=== OPTIONAL USER NOTE (do not use for classification) ===
User's description: "${description || "(no description provided)"}"`;


        const result = await model.generateContent([
          prompt,
          { inlineData: { data: matches[2], mimeType: matches[1] } }
        ]);

        let parsedData;
        try {
          let rawText = result.response.text();
          if (rawText.includes("\`\`\`json")) {
            rawText = rawText.split("\`\`\`json")[1].split("\`\`\`")[0].trim();
          } else if (rawText.includes("\`\`\`")) {
            rawText = rawText.split("\`\`\`")[1].split("\`\`\`")[0].trim();
          }
          parsedData = JSON.parse(rawText);
        } catch (err) {
          console.error(`[AI Video Analyzer] Frame ${i} parsing failed.`, err);
          continue;
        }

        if (parsedData.confidence < 60) {
          parsedData.category = "No Significant Civic Issue";
          parsedData.issueDetected = false;
        }

        console.log(`[AI Video Analyzer] Frame ${i}: ${parsedData.issueType || "None"} (${parsedData.confidence}%)`);

        frameResults.push({
          frameIndex: i,
          issueDetected: parsedData.issueDetected,
          category: parsedData.issueDetected ? parsedData.issueType : "No Significant Civic Issue",
          confidence: parsedData.confidence,
          severity: parsedData.severity || "Low",
          description: parsedData.description || "",
        });
      } catch (frameErr) {
        console.warn(`Frame ${i} analysis failed:`, frameErr);
        // Skip failed frames gracefully
      }
    }

    if (frameResults.length === 0) {
      console.error("[AI Video Analyzer] All frames failed to analyze. Returning fallback.");
      return NextResponse.json({
        issueType: "Unverified - AI Unavailable",
        confidence: 0,
        severity: "Medium",
        summary: "AI Vision is currently unavailable due to high server load or quota limits. Your video has been saved and will be reviewed manually.",
        visibleFrames: 0,
        totalFrames,
        recommendation: "Pending manual review by an administrator.",
        department: "Miscellaneous",
        frameResults: [],
        trust: evaluateVideoTrust(hasGPS, timestamp, 0, 0, totalFrames, cameraSource),
        userFeedback: [
          "AI Vision is currently unavailable due to high server load or quota limits.",
          "Your report has been saved and will be reviewed manually."
        ]
      });
    }

    const agg = aggregateResults(frameResults, totalFrames);
    const trust = evaluateVideoTrust(hasGPS, timestamp, agg.confidence, agg.visibleFrames, frameResults.length, cameraSource);
    const userFeedback = generateFeedback(agg.confidence, agg.visibleFrames, frameResults.length, agg.issueType);

    const result: VideoAnalysisResult = {
      ...agg,
      summary: `${agg.issueType} detected in ${agg.visibleFrames} of ${frameResults.length} analyzed frames. ${agg.severity} severity.`,
      totalFrames,
      frameResults,
      trust,
      userFeedback,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Video analysis error:", error);
    return NextResponse.json({
        issueType: "Unverified - AI Unavailable",
        confidence: 0,
        severity: "Medium",
        summary: `Video analysis failed: ${error.message}. Your video has been saved and will be reviewed manually.`,
        visibleFrames: 0,
        totalFrames: 1,
        recommendation: "Pending manual review by an administrator.",
        department: "Miscellaneous",
        frameResults: [],
        trust: {
          status: "Needs Review",
          verificationScore: 40,
          checks: {
            hasGPS: true,
            isFresh: true,
            confidenceScore: 0,
            consistencyScore: 0,
            metadataIntegrity: true,
            cameraSource: "Level 1 (In-App)"
          }
        },
        userFeedback: [
          "AI Vision is currently unavailable due to high server load or quota limits.",
          "Your report has been saved and will be reviewed manually."
        ]
    });
  }
}
