const videoService = require('../services/videoService');

const initializeSession = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    
    if (!patientId || !doctorId) {
      return res.status(400).json({ success: false, message: 'Missing Node Identifiers' });
    }

    const sessionData = await videoService.generateNeuralLink(patientId, doctorId);
    
    res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initializeSession };