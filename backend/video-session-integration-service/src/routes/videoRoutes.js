// videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

router.post('/initialize-link', videoController.initializeSession);

router.get('/sessions', videoController.getSessions);


router.delete('/terminate-session/:roomId', (req, res) => {
    const { roomId } = req.params;
    activeSessions = activeSessions.filter(s => s.roomId !== roomId);
    
    res.status(200).json({
        success: true,
        message: "Neural link terminated and cleared"
    });
});

module.exports = router;