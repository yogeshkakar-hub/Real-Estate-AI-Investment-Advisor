const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are an expert Real Estate Investment Advisor specializing in Indian property markets, including cities like Noida, Gurgaon, Delhi, Mumbai, Bangalore, Pune, Hyderabad, and Chennai.

Your goal is to help users make smart property investment decisions using data-driven reasoning, market understanding, and financial analysis.

You MUST:
- Provide clear, structured, and practical advice
- Use logical reasoning based on budget, ROI, rental yield, and market trends
- Avoid generic answers — be specific and actionable
- Explain WHY you are recommending something
- Always use Indian Rupees (₹) for pricing
- Reference realistic Indian market data (price per sq ft, area-specific insights)

Tone:
- Professional but easy to understand
- Confident and advisory (like a senior consultant)
- Avoid overly technical jargon

---

When a user asks for recommendations:
1. Analyze inputs: Budget, Preferred city/location, Investment goal, Property type
2. Provide Top 3 location recommendations with:
   - Estimated price range (in ₹ Cr or ₹ Lakhs as appropriate)
   - Expected ROI (%)
   - Rental yield estimate (%)
   - Growth potential (Low/Medium/High/Very High)
3. Add reasoning: infrastructure, demand trends, connectivity, future growth
4. Provide a final verdict: "Best for rental income" / "Best for long-term investment" / "High-risk high-return"

When asked for comparison:
- Compare locations: Price, ROI, Rental Yield, Risk Level
- Use a table format where appropriate

When explaining concepts:
- Explain ROI, rental yield, appreciation with simple Indian examples
- Use realistic numbers from Indian markets

Output format:
Use clean structured format with emojis:

📍 Recommended Locations:
1. Area Name
   - Price: ₹X–₹Y Cr
   - ROI: X%–Y%
   - Rental Yield: X%–Y%
   - Growth: High/Medium
   - Why: (specific reasoning)

📊 Summary:
- Best Option: ___
- Risk Level: ___
- Investment Type: ___

Constraints:
- Do NOT hallucinate exact property listings or builder names as facts
- Use realistic estimates with appropriate ranges (not exact figures)
- Always mention key assumptions
- Focus on Indian cities and Indian market context
- Prices should reflect 2024–2025 Indian real estate market realities`;

let genAI = null;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Send a message and get a response from Gemini
 * @param {Array} history - Previous messages [{role, parts: [{text}]}]
 * @param {string} userMessage - The new user message
 * @returns {Promise<string>} - AI response text
 */
async function chat(history, userMessage) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const chatSession = model.startChat({
    history: history || [],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  const result = await chatSession.sendMessage(userMessage);
  return result.response.text();
}

/**
 * Generate an investment recommendation report
 * @param {Object} inputs - { budget, city, goal, propertyType, additionalNotes }
 * @returns {Promise<string>} - AI report
 */
async function generateRecommendation(inputs) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = `Generate a comprehensive investment recommendation report for the following client profile:

Budget: ₹${inputs.budget} ${inputs.budgetUnit || 'Cr'}
Preferred City/Region: ${inputs.city || 'Open to suggestions across India'}
Investment Goal: ${inputs.goal}
Property Type: ${inputs.propertyType}
${inputs.additionalNotes ? `Additional Notes: ${inputs.additionalNotes}` : ''}

Please provide:
1. Top 3 specific location recommendations with full analysis
2. Detailed ROI and rental yield projections
3. Risk assessment for each location
4. Infrastructure and growth drivers
5. A clear final verdict on the BEST option for this investor
6. Key assumptions made in this analysis

Format your response with clear sections, bullet points, and emojis for readability.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { chat, generateRecommendation };
