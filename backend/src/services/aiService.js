const { GoogleGenerativeAI } = require('@google/generative-ai');

const getAI = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'placeholder') return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const PANIC_KEYWORDS = [
  'help', 'accident', 'bleeding', 'fire', 'attack', 'dying', 'hurt',
  'emergency', 'danger', 'crash', 'unconscious', 'blood', 'pain',
  'bachao', 'madad', 'aag', 'khoon', 'dard', 'bachana', 'help karo',
];

const detectPanicFromText = async (text) => {
  const lowerText = text.toLowerCase();
  const keywordMatches = PANIC_KEYWORDS.filter((k) => lowerText.includes(k));
  const keywordScore = Math.min(keywordMatches.length / 3, 1);

  let aiScore = 0;
  let aiAnalysis = null;
  const ai = getAI();

  if (ai && text.length > 5) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Analyze if this message indicates an emergency or panic situation. Reply with JSON only: {"isPanic": true/false, "confidence": 0-1, "emergencyType": "medical/accident/fire/crime/other/none", "severity": "critical/high/medium/low/none", "reason": "brief explanation"}. Message: "' + text + '"';
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const clean = response.replace(/```json|```/g, '').trim();
      aiAnalysis = JSON.parse(clean);
      aiScore = aiAnalysis.confidence || 0;
    } catch (e) {
      console.warn('AI analysis failed, using keyword detection:', e.message);
    }
  }

  const finalScore = ai ? (keywordScore * 0.3 + aiScore * 0.7) : keywordScore;

  return {
    isPanic: finalScore > 0.4 || keywordMatches.length >= 2,
    confidence: finalScore,
    keywordMatches,
    emergencyType: aiAnalysis?.emergencyType || (keywordMatches.length > 0 ? 'other' : 'none'),
    severity: aiAnalysis?.severity || (keywordMatches.length >= 3 ? 'critical' : keywordMatches.length >= 2 ? 'high' : 'medium'),
    reason: aiAnalysis?.reason || ('Detected keywords: ' + keywordMatches.join(', ')),
    method: ai ? 'ai+keywords' : 'keywords',
  };
};

const classifyEmergencyFromImage = async (base64Image, mimeType) => {
  const ai = getAI();
  if (!ai) return { success: false, reason: 'AI not configured' };
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = 'Analyze this emergency scene image. Reply with JSON only: {"emergencyType": "medical/accident/fire/crime/other", "severity": "critical/high/medium/low", "description": "brief description", "immediateActions": ["action1", "action2"]}';
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);
    const response = result.response.text();
    const clean = response.replace(/```json|```/g, '').trim();
    return { success: true, analysis: JSON.parse(clean) };
  } catch (e) {
    return { success: false, reason: e.message };
  }
};

module.exports = { detectPanicFromText, classifyEmergencyFromImage };