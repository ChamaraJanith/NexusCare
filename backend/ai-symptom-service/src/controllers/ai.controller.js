// src/controllers/ai.controller.js
const {
  checkSymptomsWithGemini,
} = require("../services/geminiSymptomService");

const checkSymptoms = async (req, res) => {
  try {
    const { symptomsText, age, gender } = req.body;

    if (!symptomsText) {
      return res.status(400).json({
        success: false,
        message: "symptomsText is required",
      });
    }

    const analysis = await checkSymptomsWithGemini(
      symptomsText,
      age,
      gender
    );

    return res.json({
      success: true,
      source: "Gemini",
      data: analysis,
    });
  } catch (err) {
    console.error("Gemini error:", err.message);
    if (err.response && err.response.data) {
      console.error(
        "Gemini error response:",
        JSON.stringify(err.response.data, null, 2)
      );
      return res.status(err.response.status || 500).json({
        success: false,
        error: "AI service error",
        details: err.response.data.error?.message || err.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "AI service error",
      details: err.message,
    });
  }
};

module.exports = { checkSymptoms };