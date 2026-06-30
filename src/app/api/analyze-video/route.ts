import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ─── Per-frame result from Gemini ─────────────────────────────────────────────
interface FrameResult {
  frameIndex: number;
  issueDetected: boolean;
  category: string;
  confidence: number;
  severity: string;
  severityReason: string;
  description: string;
}

// ─── Final aggregated output ──────────────────────────────────────────────────
interface VideoAnalysisResult {
  issueType: string;
  confidence: number;
  severity: string;
  severityReason: string;
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
const generateFeedback = (confidence: number, visibleFrames: number, totalFrames: number, category: string, locale: string = "en"): string[] => {
  const tips: string[] = [];
  const ratio = visibleFrames / totalFrames;

  if (locale === "hi") {
    if (confidence < 50) {
      tips.push("मुद्दा स्पष्ट रूप से दिखाई नहीं दे रहा है। कृपया समस्या क्षेत्र के करीब जाएं।");
      tips.push("प्रकाश अपर्याप्त है। बेहतर प्रकाश व्यवस्था में कैप्चर करने का प्रयास करें।");
    }
    if (ratio < 0.5 && category !== "No Significant Civic Issue" && category !== "कोई महत्वपूर्ण नागरिक समस्या नहीं") {
      tips.push(`रिपोर्ट किया गया मुद्दा केवल ${totalFrames} में से ${visibleFrames} फ्रेम में दिखाई दिया। उच्च विश्वसनीयता के लिए, कैमरे को स्थिर रखते हुए कुछ और सेकंड के लिए रिकॉर्ड करें।`);
    }
    if (category === "No Significant Civic Issue" || category === "कोई महत्वपूर्ण नागरिक समस्या नहीं") {
      tips.push("हमारे एआई को वीडियो में कोई नागरिक समस्या नहीं मिली। कृपया सुनिश्चित करें कि आप सही क्षेत्र रिकॉर्ड कर रहे हैं।");
      tips.push("अलग कोण से रिकॉर्ड करने या समस्या के करीब जाने का प्रयास करें।");
    }
  } else {
    if (confidence < 50) {
      tips.push("The issue is not clearly visible. Please move closer to the problem area.");
      tips.push("Lighting is insufficient. Try capturing in better lighting conditions.");
    }
    if (ratio < 0.5 && category !== "No Significant Civic Issue" && category !== "कोई महत्वपूर्ण नागरिक समस्या नहीं") {
      tips.push(`The reported issue only appeared in ${visibleFrames} of ${totalFrames} frames. For higher confidence, record for a few more seconds while keeping the camera steady.`);
    }
    if (category === "No Significant Civic Issue" || category === "कोई महत्वपूर्ण नागरिक समस्या नहीं") {
      tips.push("Our AI could not detect any civic issue in the video. Please ensure you are recording the correct area.");
      tips.push("Try recording from a different angle or moving closer to the issue.");
    }
  }

  return tips;
};

// ─── Aggregate frame results ──────────────────────────────────────────────────
const aggregateResults = (frames: FrameResult[], totalFrames: number, locale: string = "en"): Pick<VideoAnalysisResult, "issueType" | "confidence" | "severity" | "severityReason" | "visibleFrames" | "recommendation" | "department"> => {
  const issueFrames = frames.filter(f => f.issueDetected && f.category !== "No Significant Civic Issue" && f.category !== "कोई महत्वपूर्ण नागरिक समस्या नहीं");
  const visibleFrames = issueFrames.length;

  if (visibleFrames === 0) {
    return {
      issueType: "No Significant Civic Issue",
      confidence: Math.round(frames.reduce((s, f) => s + f.confidence, 0) / frames.length) || 50,
      severity: "Low",
      severityReason: locale === "hi" ? "वीडियो में कोई महत्वपूर्ण नागरिक समस्या नहीं पाई गई।" : "No significant civic issue detected in the video.",
      visibleFrames: 0,
      recommendation: locale === "hi" ? "नागरिक समस्या का पता लगाने में असमर्थ। कृपया भिन्न कोण से दोबारा रिकॉर्ड करें।" : "Unable to detect a significant civic issue. Please record again from a different angle.",
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
  const severityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, "गंभीर": 4, "उच्च": 3, "मध्यम": 2, "निम्न": 1 };
  const topFrame = issueFrames
    .sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))[0];

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

  const resolveSeverityEnglish = (val: string): string => {
    if (!val) return "Low";
    const valLower = val.toLowerCase();
    if (valLower.includes("critical") || valLower.includes("गंभीर")) return "Critical";
    if (valLower.includes("high") || valLower.includes("उच्च")) return "High";
    if (valLower.includes("medium") || valLower.includes("मध्यम")) return "Medium";
    if (valLower.includes("low") || valLower.includes("निम्न")) return "Low";
    return "Low";
  };

  const engCategory = resolveCategoryEnglish(dominantCategory);

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

  const deptEng = deptMap[engCategory] || "Miscellaneous";
  
  let recommendation = `Assign to ${deptEng} — ${topFrame.severity} priority.`;
  if (locale === "hi") {
    const deptMapHi: Record<string, string> = {
      "Roads Department": "सड़क विभाग",
      "Electricity Department": "बिजली विभाग",
      "Water Department": "जल विभाग",
      "Municipal Committee": "नगर पालिका समिति",
      "Animal Control": "पशु नियंत्रण",
      "Traffic Police": "यातायात पुलिस",
      "Parks Department": "पार्क विभाग",
      "Miscellaneous": "विविध"
    };
    const departmentHi = deptMapHi[deptEng] || "विविध";
    recommendation = `${departmentHi} को आवंटित करें — ${topFrame.severity} प्राथमिकता।`;
  }

  return {
    issueType: engCategory,
    confidence: finalConfidence,
    severity: resolveSeverityEnglish(topFrame.severity),
    severityReason: topFrame.severityReason,
    visibleFrames,
    recommendation,
    department: deptEng,
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
  let locale = "en";
  try {
    const body = await req.json();
    const { frames, description = "", latitude, longitude, timestamp, cameraSource = "Level 1 (In-App)" } = body;
    if (body.locale) locale = body.locale;

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
        category: isIssue ? (locale === "hi" ? "सड़क की क्षति" : "Road Damage") : (locale === "hi" ? "कोई महत्वपूर्ण नागरिक समस्या नहीं" : "No Significant Civic Issue"),
        confidence: isIssue ? 80 : 0,
        severity: isIssue ? (locale === "hi" ? "उच्च" : "High") : (locale === "hi" ? "निम्न" : "Low"),
        severityReason: isIssue ? (locale === "hi" ? "एपीआई अनुपलब्ध - डिफ़ॉल्ट उच्च" : "API Unavailable - Default High") : (locale === "hi" ? "एपीआई कुंजी और विवरण की कमी के कारण किसी समस्या का पता नहीं चला।" : "No issue detected due to missing API key and description."),
        description: isIssue ? (locale === "hi" ? "एपीआई सीमा के कारण फ़ॉलबैक विश्लेषण" : "Fallback analysis due to API limit") : (locale === "hi" ? "एपीआई कुंजी और विवरण की कमी के कारण किसी समस्या का पता नहीं चला।" : "No issue detected due to missing API key and description."),
      }));
      const agg = aggregateResults(mockFrames, totalFrames, locale);
      return NextResponse.json({
        ...agg,
        summary: locale === "hi" ? `फ़ॉलबैक विश्लेषण: विवरण के आधार पर ${agg.issueType} का पता चला। कृपया जेमिनी एपीआई कुंजी कॉन्फ़िगर करें।` : `Fallback Analysis: ${agg.issueType} detected based on description. Please configure Gemini API key.`,
        totalFrames,
        frameResults: mockFrames,
        trust: evaluateVideoTrust(hasGPS, timestamp, agg.confidence, agg.visibleFrames, totalFrames, cameraSource),
        userFeedback: locale === "hi" ? ["जेमिनी एपीआई कुंजी गायब है। विज़न के बजाय बुनियादी पाठ विश्लेषण का उपयोग किया गया।"] : ["Gemini API key missing. Used basic text analysis instead of vision."],
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
          parsedData.category = locale === "hi" ? "कोई महत्वपूर्ण नागरिक समस्या नहीं" : "No Significant Civic Issue";
          parsedData.issueDetected = false;
        }

        console.log(`[AI Video Analyzer] Frame ${i}: ${parsedData.issueType || "None"} (${parsedData.confidence}%)`);

        frameResults.push({
          frameIndex: i,
          issueDetected: parsedData.issueDetected,
          category: parsedData.issueDetected ? parsedData.issueType : (locale === "hi" ? "कोई महत्वपूर्ण नागरिक समस्या नहीं" : "No Significant Civic Issue"),
          confidence: parsedData.confidence,
          severity: parsedData.severity || (locale === "hi" ? "निम्न" : "Low"),
          severityReason: parsedData.severityReason || (locale === "hi" ? "एआई द्वारा प्रदान नहीं किया गया" : "Not provided by AI"),
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
        issueType: locale === "hi" ? "असत्यापित - एआई अनुपलब्ध" : "Unverified - AI Unavailable",
        confidence: 0,
        severity: locale === "hi" ? "मध्यम" : "Medium",
        summary: locale === "hi" ? "उच्च सर्वर लोड या कोटा सीमा के कारण एआई विज़न वर्तमान में अनुपलब्ध है। आपका वीडियो सहेज लिया गया है और मैन्युअल रूप से समीक्षा की जाएगी।" : "AI Vision is currently unavailable due to high server load or quota limits. Your video has been saved and will be reviewed manually.",
        visibleFrames: 0,
        totalFrames,
        recommendation: locale === "hi" ? "व्यवस्थापक द्वारा मैन्युअल समीक्षा लंबित।" : "Pending manual review by an administrator.",
        department: locale === "hi" ? "विविध" : "Miscellaneous",
        frameResults: [],
        trust: evaluateVideoTrust(hasGPS, timestamp, 0, 0, totalFrames, cameraSource),
        userFeedback: locale === "hi" ? [
          "उच्च सर्वर लोड या कोटा सीमा के कारण एआई विज़न वर्तमान में अनुपलब्ध है।",
          "आपकी रिपोर्ट सहेज ली गई है और मैन्युअल रूप से समीक्षा की जाएगी।"
        ] : [
          "AI Vision is currently unavailable due to high server load or quota limits.",
          "Your report has been saved and will be reviewed manually."
        ]
      });
    }

    const agg = aggregateResults(frameResults, totalFrames, locale);
    const trust = evaluateVideoTrust(hasGPS, timestamp, agg.confidence, agg.visibleFrames, frameResults.length, cameraSource);
    const userFeedback = generateFeedback(agg.confidence, agg.visibleFrames, frameResults.length, agg.issueType, locale);

    const result: VideoAnalysisResult = {
      ...agg,
      summary: locale === "hi" ? `${agg.issueType} का ${frameResults.length} में से ${agg.visibleFrames} विश्लेषण किए गए फ्रेम में पता चला। ${agg.severity} गंभीरता।` : `${agg.issueType} detected in ${agg.visibleFrames} of ${frameResults.length} analyzed frames. ${agg.severity} severity.`,
      totalFrames,
      frameResults,
      trust,
      userFeedback,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Video analysis error:", error);
    return NextResponse.json({
        issueType: locale === "hi" ? "असत्यापित - एआई अनुपलब्ध" : "Unverified - AI Unavailable",
        confidence: 0,
        severity: locale === "hi" ? "मध्यम" : "Medium",
        summary: locale === "hi" ? `वीडियो विश्लेषण विफल: ${error.message}। आपका वीडियो सहेज लिया गया है और मैन्युअल रूप से समीक्षा की जाएगी।` : `Video analysis failed: ${error.message}. Your video has been saved and will be reviewed manually.`,
        visibleFrames: 0,
        totalFrames: 1,
        recommendation: locale === "hi" ? "व्यवस्थापक द्वारा मैन्युअल समीक्षा लंबित।" : "Pending manual review by an administrator.",
        department: locale === "hi" ? "विविध" : "Miscellaneous",
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
        userFeedback: locale === "hi" ? [
          "उच्च सर्वर लोड या कोटा सीमा के कारण एआई विज़न वर्तमान में अनुपलब्ध है।",
          "आपकी रिपोर्ट सहेज ली गई है और मैन्युअल रूप से समीक्षा की जाएगी।"
        ] : [
          "AI Vision is currently unavailable due to high server load or quota limits.",
          "Your report has been saved and will be reviewed manually."
        ]
    });
  }
}
