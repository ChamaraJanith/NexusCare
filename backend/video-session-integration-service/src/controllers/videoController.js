const VideoSession = require('../models/videoSessionModel');
const videoService = require('../services/videoService');

// 1. සෙෂන් එකක් ආරම්භ කර Database එකේ Save කිරීම
const initializeSession = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    
    if (!patientId || !doctorId) {
      return res.status(400).json({ success: false, message: 'Missing Node Identifiers' });
    }

    // Service එක හරහා Room ID සහ අනෙකුත් දත්ත ලබා ගැනීම
    const sessionData = await videoService.generateNeuralLink(patientId, doctorId);
    
    // --- මෙන්න මෙතන තමයි වෙනස ---
    // Array එකට දානවා වෙනුවට MongoDB එකේ අලුත් Record එකක් හදනවා
    const newSession = new VideoSession({
      roomId: sessionData.roomId,
      patientId: sessionData.patientId,
      doctorId: sessionData.doctorId,
      status: 'ACTIVE' // ආරම්භයේදී ACTIVE ලෙස පවතී
    });

    await newSession.save(); 
    console.log(`✅ New Active Session Saved: ${sessionData.roomId}`);
    
    res.status(200).json({ success: true, data: newSession });
  } catch (error) {
    console.error("Initialize Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. සියලුම සෙෂන් Database එකෙන් ලබා ගැනීම (Frontend History එකට අවශ්‍ය වේ)
const getSessions = async (req, res) => {
  try {
    // Array එක පාවිච්චි නොකර කෙලින්ම Database එකෙන් දත්ත ගන්න
    const allSessions = await VideoSession.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: allSessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. සෙෂන් එකක් ඉවර වූ පසු Status එක Update කිරීම
const endSession = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, message: "Room ID is required" });
    }

    const updatedSession = await VideoSession.findOneAndUpdate(
      { roomId: roomId, status: 'ACTIVE' }, 
      { 
        status: 'COMPLETED',
        updatedAt: new Date() 
      },
      { returnDocument: 'after' } 
    );

    if (!updatedSession) {
      return res.status(404).json({ success: false, message: "Active session not found in DB." });
    }

    console.log(`✅ Session ${roomId} marked as COMPLETED in DB`);
    res.status(200).json({ success: true, data: updatedSession });

  } catch (error) {
    console.error("Error in endSession:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { initializeSession, getSessions, endSession };