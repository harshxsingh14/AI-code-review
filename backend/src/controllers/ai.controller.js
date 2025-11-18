const aiService = require("../services/ai.service.js");

module.exports.getReview = async (req, res) => {
    try {
        const code = req.body.code;

        if (!code) {
            return res.status(400).send("Prompt is required");
        }

        const response = await aiService(code);
        res.send(response);

    } catch (error) {
        console.error("Controller Error:", error);
        // ✅ CORRECTED LINE: Sends the string message "Error generating review"
        res.status(500).send("Error generating review");
    }
};