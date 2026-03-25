const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

async function checkSymptomsWithGemini(symptomsText, age, gender) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "Missing GEMINI_API_KEY environment variable. Set it in .env or your process env."
    );
  }

  const prompt = `
You are a medical triage assistant (NOT a doctor).
User symptoms: ${symptomsText}
Age: ${age}
Gender: ${gender}

Return ONLY valid JSON with this exact shape:

{
  "riskLevel": "low" | "medium" | "high" | "emergency",
  "topConditions": [
    { "name": "Condition name", "likelihood": "low" | "medium" | "high" }
  ],
  "suggestedSpeciality": "e.g. General practitioner",
  "advice": "Short, friendly advice with red-flag warnings."
}
`;

  const client = new GoogleGenerativeAI(apiKey);
  const validModel = GEMINI_MODEL || "gemini-3-flash-preview";
  const model = client.getGenerativeModel({ model: validModel });

  const result = await model.generateContent(prompt, {
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
      candidateCount: 1,
      responseMimeType: "application/json",
    },
  });

  const candidate = result?.response?.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.length) {
    throw new Error("No response from Gemini");
  }

  const text = candidate.content.parts[0].text;
  if (!text || text.trim().length === 0) {
    throw new Error("No response text from Gemini");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Gemini JSON parse error, raw text:", text);
    throw new Error("Failed to parse AI response");
  }

  return {
    riskLevel: parsed.riskLevel,
    topConditions: parsed.topConditions || [],
    suggestedSpeciality: parsed.suggestedSpeciality,
    advice: parsed.advice,
  };
}


const effectiveApiKey = process.env.GEMINI_API_KEY;
console.log(
  "GEMINI_API_KEY prefix:",
  effectiveApiKey ? effectiveApiKey.slice(0, 8) + "..." : "MISSING"
);
console.log("GEMINI_MODEL:", GEMINI_MODEL);

module.exports = { checkSymptomsWithGemini };