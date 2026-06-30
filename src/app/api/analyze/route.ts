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
const generateUserFeedback = (confidence: number, category: string, locale: string = "en"): string[] => {
  const tips: string[] = [];
  if (locale === "hi") {
    if (confidence < 50) {
      tips.push("मुद्दा स्पष्ट रूप से दिखाई नहीं दे रहा है। कृपया समस्या क्षेत्र के करीब जाएं।");
      tips.push("प्रकाश अपर्याप्त है। बेहतर प्रकाश व्यवस्था में कैप्चर करने का प्रयास करें।");
    } else if (confidence < 70) {
      tips.push("रिपोर्ट किया गया मुद्दा लगातार दिखाई नहीं दे रहा है। कृपया करीब से दोबारा फोटो लें।");
      tips.push("सुनिश्चित करें कि नागरिक समस्या फ्रेम के अधिकांश हिस्से को कवर करती है।");
    }
    if (category === "No Issue Detected") {
      tips.push("हमारे एआई को कैप्चर की गई मीडिया में कोई नागरिक समस्या नहीं मिली। कृपया सत्यापित करें कि आप सही क्षेत्र कैप्चर कर रहे हैं।");
    }
  } else {
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
  }
  return tips;
};

// ─── Fallback Engine ────────────────────────────────────────────────────────────
const getFallbackAnalysis = (hasGPS: boolean, timestamp?: number, cameraSource: string = "Level 2 (Gallery Upload)", errorReason?: string, locale: string = "en") => {
  console.log(`[AI Analyzer] Vision API unavailable. Reason: ${errorReason || "API Key missing"}`);

  const trust = evaluateTrust(hasGPS, timestamp, 0, false, cameraSource);

  if (locale === "hi") {
    return {
      category: "Unverified - AI Unavailable",
      severity: "Medium" as const,
      severityReason: "एआई विज़न उपलब्ध नहीं है, मध्यम पर डिफ़ॉल्ट किया गया",
      confidence: 0,
      department: "Miscellaneous",
      reasoningPoints: [
        `एआई विजन वर्तमान में अनुपलब्ध है: ${errorReason || "कोई एपीआई कुंजी कॉन्फ़िगर नहीं की गई है"}।`,
        "समस्या का पता लगाने के लिए जेमिनी विजन एपीआई से विजुअल विश्लेषण की आवश्यकता होती है।",
        "कृपया जांचें कि GEMINI_API_KEY ठीक से सेट है या नहीं।"
      ],
      trust,
      userFeedback: [
        "उच्च सर्वर लोड या कोटा सीमा के कारण एआई विज़न वर्तमान में अनुपलब्ध है।",
        "आपकी रिपोर्ट सहेज ली गई है और व्यवस्थापक द्वारा मैन्युअल रूप से समीक्षा की जाएगी।"
      ],
    };
  }

  return {
    category: "Unverified - AI Unavailable",
    severity: "Medium" as const,
    severityReason: "AI unavailable, defaulted to Medium",
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
  let locale = "en";

  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64;
    description = body.description || "";
    hasGPS = !!(body.latitude && body.longitude);
    timestamp = body.timestamp;
    if (body.cameraSource) cameraSource = body.cameraSource;
    if (body.locale) locale = body.locale;

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
      return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, "No API Key configured", locale));
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

    let promptLocaleInstruction = "";
    if (locale === "hi") {
      promptLocaleInstruction = `
IMPORTANT: The user's preferred language is Hindi.
You MUST translate all string values in the JSON response to Hindi:
- "issueType": Use Hindi equivalent (e.g., "गड्ढा" instead of "Pothole", "सड़क की क्षति" instead of "Road Damage", "कूड़े का ढेर" instead of "Garbage Dump", "उफनता हुआ कूड़ेदान" instead of "Overflowing Dustbin", "टूटी स्ट्रीटलाइट" instead of "Broken Streetlight")
- "severity": Translate "Low | Medium | High | Critical" to Hindi equivalent ("निम्न" | "मध्यम" | "उच्च" | "गंभीर")
- "severityReason": Write the explanation in Hindi
- "description": Write the description/analysis of the issue in Hindi
- "evidence": Write the evidence description in Hindi
All JSON keys MUST remain in English as defined above.`;
    }

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
  "severityReason": "",
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
${promptLocaleInstruction}

=== OPTIONAL USER NOTE (do not use for classification) ===
User's description: "${description || "(no description provided)"}"`;

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      console.log("[AI Analyzer] Invalid Base64 — cannot extract MIME type or data.");
      return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, "Invalid image format", locale));
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
      return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, "Gemini returned non-parseable response", locale));
    }

    // Helper to resolve English category from Hindi/English Gemini output
    const resolveCategoryEnglish = (val: string): string => {
      if (!val) return "Other";
      const CATEGORY_MAP: Record<string, string[]> = {
        "Pothole": ["pothole", "गड्ढा", "सड़क का गड्ढा"],
        "Road Damage": ["road damage", "सड़क की क्षति", "सड़क का नुकसान"],
        "Water Leakage": ["water leakage", "पानी का रिसाव", "जल रिसाव"],
        "Waterlogging": ["waterlogging", "जलभराव", "जलजमाव"],
        "Garbage Dump": ["garbage dump", "कचरे का ढेर", "कूड़े का ढेर"],
        "Overflowing Dustbin": ["overflowing dustbin", "कूड़ेदान का भरना", "उफनता हुआ कूड़ेदान"],
        "Broken Streetlight": ["broken streetlight", "टूटी स्ट्रीटलाइट", "खराब स्ट्रीटलाइट"],
        "Damaged Footpath": ["damaged footpath", "क्षतिग्रस्त फुटपाथ", "टूटा फुटपाथ"],
        "Open Manhole": ["open manhole", "खुला मैनहोल"],
        "Sewage Overflow": ["sewage overflow", "सीवेज ओवरफ्लो", "गंदे पानी का बहना"],
        "Blocked Drain": ["blocked drain", "बंद नाली", "अवरुद्ध नाली"],
        "Traffic Signal Damage": ["traffic signal damage", "यातायात संकेत क्षति"],
        "Fallen Tree": ["fallen tree", "गिरा पेड़", "गिरा हुआ पेड़"],
        "Stray Animal": ["stray animal", "आवारा पशु", "आवारा जानवर"],
        "Park Maintenance Issue": ["park maintenance", "पार्क रखरखाव"],
        "Broken Public Property": ["broken public property", "टूटी सार्वजनिक संपत्ति"],
        "Electrical Hazard": ["electrical hazard", "बिजली का खतरा"],
        "Illegal Dumping": ["illegal dumping", "अवैध डंपिंग"],
        "Encroachment": ["encroachment", "अतिक्रमण"],
        "Public Toilet Issue": ["public toilet", "सार्वजनिक शौचालय"],
      };

      for (const [key, aliases] of Object.entries(CATEGORY_MAP)) {
        if (key.toLowerCase() === val.toLowerCase()) return key;
        for (const alias of aliases) {
          if (val.toLowerCase().includes(alias.toLowerCase()) || alias.toLowerCase().includes(val.toLowerCase())) {
            return key;
          }
        }
      }
      return "Other";
    };

    const getDepartment = (issueType: string): string => {
      const engCategory = resolveCategoryEnglish(issueType);
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
      const deptEng = map[engCategory] || "Miscellaneous";
      return deptEng;
    };

    const resolveSeverityEnglish = (val: string): string => {
      if (!val) return "Low";
      const valLower = val.toLowerCase();
      if (valLower.includes("critical") || valLower.includes("गंभीर")) return "Critical";
      if (valLower.includes("high") || valLower.includes("उच्च")) return "High";
      if (valLower.includes("medium") || valLower.includes("मध्यम")) return "Medium";
      if (valLower.includes("low") || valLower.includes("निम्न")) return "Low";
      return "Low";
    };

    const rawCategory = parsedData.issueDetected ? parsedData.issueType : "No Significant Civic Issue";
    let finalCategory = resolveCategoryEnglish(rawCategory);
    let finalSeverity = resolveSeverityEnglish(parsedData.severity);
    
    if (parsedData.confidence < 60) {
      console.log(`[AI Analyzer] Confidence ${parsedData.confidence}% below threshold. Overriding to "No Significant Civic Issue".`);
      finalCategory = "No Significant Civic Issue";
      finalSeverity = "Low";
    }

    const trust = evaluateTrust(hasGPS, timestamp, parsedData.confidence, false, cameraSource);
    const userFeedback = generateUserFeedback(parsedData.confidence, finalCategory, locale);

    const reasoningPoints = [
      parsedData.description ? (locale === "hi" ? `विवरण: ${parsedData.description}` : `Description: ${parsedData.description}`) : (locale === "hi" ? "खोज दृश्य साक्ष्य पर आधारित है।" : "Detection is based on visual evidence."),
      parsedData.evidence ? (locale === "hi" ? `साक्ष्य: ${parsedData.evidence}` : `Evidence: ${parsedData.evidence}`) : "",
      locale === "hi" ? `एआई विश्वसनीयता: ${parsedData.confidence}%` : `AI Confidence: ${parsedData.confidence}%`
    ].filter(Boolean);

    const finalResponse = {
      category: finalCategory,
      severity: finalSeverity,
      severityReason: parsedData.severityReason || (locale === "hi" ? "एआई द्वारा प्रदान नहीं किया गया" : "Not provided by AI"),
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
    return NextResponse.json(getFallbackAnalysis(hasGPS, timestamp, cameraSource, `Execution Error: ${error.message}`, locale));
  }
}

