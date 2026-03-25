// videoController.js
const videoService = require('../services/videoService');

// මෙන්න මේ array එක අනිවාර්යයෙන්ම ඕනේ!
let activeSessions = []; 

const initializeSession = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    
    if (!patientId || !doctorId) {
      return res.status(400).json({ success: false, message: 'Missing Node Identifiers' });
    }

    const sessionData = await videoService.generateNeuralLink(patientId, doctorId);
    
    // මෙතනදී තමයි array එකට දත්ත දාන්නේ
    activeSessions.push(sessionData); 
    
    res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET රූට් එකට දත්ත යැවීමට අලුත් function එකක්
const getSessions = (req, res) => {
  res.status(200).json({
    success: true,
    data: activeSessions
  });
};

module.exports = { initializeSession, getSessions };