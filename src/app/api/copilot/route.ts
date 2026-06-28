import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { prompt: userPrompt, issuesData } = await req.json();

    if (!userPrompt || !issuesData) {
      return NextResponse.json({ error: 'Prompt and issuesData are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Mock fallback if no API key
    if (!apiKey || apiKey === "your_gemini_api_key") {
      console.log("No Gemini API key found. Using mock Copilot analysis.");
      // Simple mock: if user asks for urgent, filter by High/Critical
      const isUrgent = userPrompt.toLowerCase().includes('urgent');
      const filtered = isUrgent 
        ? issuesData.filter((i: any) => i.severity === 'High' || i.severity === 'Critical')
        : issuesData.slice(0, 2); // just return first two as mock
      
      return NextResponse.json({
        answer: isUrgent 
          ? `I found ${filtered.length} urgent issues that need immediate attention.`
          : `Here are some issues based on your request. I found ${filtered.length} matches.`,
        filteredIssueIds: filtered.map((i: any) => i.id)
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `
      You are an expert Municipality AI Copilot. You help city authorities manage civic issues.
      You have access to the following JSON database of current issues:
      ${JSON.stringify(issuesData)}

      The user asks: "${userPrompt}"

      Your job is to:
      1. Understand the user's natural language query (e.g., "show me urgent water leaks").
      2. Filter the provided issues database to find the matching issues.
      3. Return a friendly, conversational answer summarizing what you found.
      4. EXPLAINABLE AI RULE: You MUST explicitly cite the exact Issue IDs (e.g., "ISSUE-12345") in your conversational answer so the authority knows which ones you are referring to.
      5. Return an exact array of the IDs of the issues that match the query.

      Respond ONLY with a valid JSON object matching this exact schema:
      {
        "answer": "String (A conversational response summarizing findings, MUST contain explicit citations of the Issue IDs)",
        "filteredIssueIds": ["Array of Strings (The exact IDs of the matching issues)"]
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error in Copilot analysis:', error);
    return NextResponse.json({
      answer: "I encountered an error trying to process your request.",
      filteredIssueIds: []
    }, { status: 500 });
  }
}
