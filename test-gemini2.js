const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
});

async function run() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const prompt = `Return {"isResolved": true}`;
    const result = await model.generateContent([prompt]);
    console.log("Result:", result.response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
