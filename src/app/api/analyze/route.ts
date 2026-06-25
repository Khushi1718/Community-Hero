import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ─── Trust Engine ─────────────────────────────────────────────────────────────
const evaluateTrust = (
  hasGPS: boolean,
  timestamp: number | undefined,
  confidence: number,
  isSpam: boolean = false,
  cameraSource: string = "Level 2 (Gallery Upload)",
  metadataIntegrity: boolean = true,
  descriptionMatchScore: number = 80
) => {
  const isFresh = !!timestamp && (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
  const isLevel1 = cameraSource === "Level 1 (In-App)";

  let spamScore = isSpam ? 95 : 10;
  if (!hasGPS) spamScore += 20;
  if (confidence < 60) spamScore += 30;

  // Verification Score (0-100) based on multiple signals
  let verificationScore = 0;
  verificationScore += confidence * 0.35;            // AI Detection Confidence (35pts)
  verificationScore += (isLevel1 ? 20 : 5);          // Camera Source (20pts)
  verificationScore += (hasGPS ? 20 : 0);            // GPS Availability (20pts)
  verificationScore += (isFresh ? 10 : 0);           // Timestamp Validity (10pts)
  verificationScore += (metadataIntegrity ? 10 : 0); // Metadata Integrity (10pts)
  verificationScore += (descriptionMatchScore / 100) * 5; // Description Match (5pts)
  if (isSpam) verificationScore -= 60;

  verificationScore = Math.max(0, Math.min(100, Math.round(verificationScore)));

  let status: "Verified" | "Needs Review" | "Suspicious";
  if (verificationScore >= 75) status = "Verified";
  else if (verificationScore >= 45) status = "Needs Review";
  else status = "Suspicious";

  return {
    status,
    verificationScore,
    checks: {
      hasGPS,
      isFresh,
      confidenceScore: confidence,
      spamScore,
      cameraSource,
      metadataIntegrity,
    }
  };
};

// ─── Low-confidence feedback generator ────────────────────────────────────────
const generateUserFeedback = (confidence: number, category: string): string[] => {
  const tips: string[] = [];
  if (confidence < 50) {
    tips.push("The issue is not clearly visible. Please move closer to the problem area.");
    tips.push("Lighting is insufficient. Try capturing in better lighting conditions.");
  } else if (confidence < 70) {
    tips.push("The reported issue is not consistently visible. Please re-record from a closer angle.");
    tips.push("Ensure the civic issue fills most of the frame for higher confidence.");
  }
  if (category === "No Issue Detected") {
    tips.push("Our AI could not detect any civic issue in the captured media. Please verify you're recording the correct area.");
  }
  return tips;
};

// ─── Fallback Engine ────────────────────────────────────────────────────────────
// This NEVER tries to detect from description.
// It only returns "unavailable" — detection is purely visual (Gemini Vision).
const getFallbackAnalysis = (hasGPS: boolean, timestamp?: number, cameraSource: string = "Level 2 (Gallery Upload)", errorReason?: string) => {
  console.log(`[AI Analyzer] Vision API unavailable. Reason: ${errorReason || "API Key missing"}`);

  const trust = evaluateTrust(hasGPS, timestamp, 0, false, cameraSource);

  return {
    category: "Unverified - AI Unavailable",
    severity: "Medium" as const,
    confidence: 0,
    department: "Miscellaneous",
    reasoningPoints: [
      `AI Vision is currently unavailable: ${errorReason || "No API Key configured"}.`,
      "Issue detection requires visual analysis from Gemini Vision API.",
      "Please verify your GEMINI_API_KEY is set correctly in environment variables."
    ],
    trust,
    userFeedback: [
      "AI Vision is currently unavailable due to high server load or quota limits.",
      "Your report has been saved and will be reviewed manually by an administrator."
    ],
  };
};

// ─── Main POST handler ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  let description = "";
  let hasGPS = false;
  let timestamp: number | undefined;
  let cameraSource = "Level 2 (Gallery Upload)";

  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64;
    description = body.description || "";
    hasGPS = !!(body.latitude && body.longitude);
    timestamp = body.timestamp;
    if (body.cameraSource) cameraSource = body.cameraSource;

    // Legacy support: location string format
    if (!hasGPS && body.location) {
      hasGPS = body.location.trim().length > 0;
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey === "your_gemini_api_key_here") {
      console.log("[AI Analyzer] No valid Gemini API key found. Returning unavailable response.");
      return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, "No API Key configured"));
    }

    console.log(`[AI Analyzer] Image received — Base64 length: ${imageBase64.length}`);
    console.log(`[AI Analyzer] Optional user description (NOT used for detection): "${description || "(empty)"}"`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are an AI Municipal Inspector.

Analyze the provided IMAGE carefully.

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
- Base your decision ONLY on visible evidence.
- Never guess.
- Ignore people, vehicles and buildings unless they are directly related to the issue.
- If multiple issues exist, choose the primary issue and list the others.
- If no civic issue is clearly visible, return issueDetected=false.
- If the image/video is blurry or unclear, lower the confidence and set needsHumanReview=true.

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

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      console.log("[AI Analyzer] Invalid Base64 — cannot extract MIME type or data.");
      return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, "Invalid image format"));
    }

    console.log("[AI Analyzer] Sending to Gemini Vision API...");
    const result = await model.generateContent([prompt, { inlineData: { data: matches[2], mimeType: matches[1] } }]);

    console.log("[AI Analyzer] Raw Gemini response:", result.response.text());

    let parsedData;
    try {
      let rawText = result.response.text();
      if (rawText.includes("```json")) {
        rawText = rawText.split("```json")[1].split("```")[0].trim();
      } else if (rawText.includes("```")) {
        rawText = rawText.split("```")[1].split("```")[0].trim();
      }
      parsedData = JSON.parse(rawText);
      console.log(`[AI Analyzer] Parsed: ${parsedData.issueType || "None"} (${parsedData.confidence}%)`);
    } catch (parseError) {
      console.error("[AI Analyzer] JSON parsing failed:", parseError);
      return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, "Gemini returned non-parseable response"));
    }

    const getDepartment = (issueType: string): string => {
      const map: Record<string, string> = {
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
      return map[issueType] || "Miscellaneous";
    };

    let finalCategory = parsedData.issueDetected ? parsedData.issueType : "No Significant Civic Issue";
    let finalSeverity = parsedData.severity || "Low";
    
    if (parsedData.confidence < 60) {
      console.log(`[AI Analyzer] Confidence ${parsedData.confidence}% below threshold. Overriding to "No Significant Civic Issue".`);
      finalCategory = "No Significant Civic Issue";
      finalSeverity = "Low";
    }

    const trust = evaluateTrust(hasGPS, timestamp, parsedData.confidence, false, cameraSource);
    const userFeedback = generateUserFeedback(parsedData.confidence, finalCategory);

    const reasoningPoints = [
      parsedData.description ? `Description: ${parsedData.description}` : "Detection is based on visual evidence.",
      parsedData.evidence ? `Evidence: ${parsedData.evidence}` : "",
      `AI Confidence: ${parsedData.confidence}%`
    ].filter(Boolean);

    const finalResponse = {
      category: finalCategory,
      severity: finalSeverity,
      confidence: parsedData.confidence,
      department: getDepartment(finalCategory),
      reasoningPoints,
      trust,
      userFeedback,
    };

    console.log(`[AI Analyzer] ✓ Final: ${finalResponse.category} (${finalResponse.confidence}%) → ${finalResponse.department}`);
    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error("[AI Analyzer] Fatal error:", error);
    return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, `Execution Error: ${error.message}`));
  }
}

