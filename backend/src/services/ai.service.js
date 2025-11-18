const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_KEY
});

const SYSTEM_INSTRUCTION = `
You are a senior code reviewer. Review the provided code with:
- clarity and readability improvements
- performance and optimization suggestions
- security issues
- best practices
- proper structure
Return your response in a clean, formatted manner.
`;

/**
 * Generates code review content using the Gemini model.
 * @param {string} prompt The code snippet to send to the model for review.
 * @returns {Promise<string>} The generated text review.
 */
async function generateContent(prompt) {
    if (!prompt || typeof prompt !== "string") {
        throw new Error("A valid text prompt (code) is required.");
    }

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });

        return result.text;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
}

module.exports = generateContent;