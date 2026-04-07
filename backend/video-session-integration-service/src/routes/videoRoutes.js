// videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const syncController = require('../controllers/syncController');

let activeSessions = [];

router.post('/initialize-link', videoController.initializeSession);
router.get('/doctors', videoController.getDoctors);
router.get('/health', videoController.healthCheck);

router.post('/sync/doctor', syncController.verifyInternalKey, syncController.upsertDoctor);
router.delete('/sync/doctor/:doctorId', syncController.verifyInternalKey, syncController.removeDoctor);
router.post('/sync/bootstrap', syncController.verifyInternalKey, syncController.bootstrapDoctorCatalog);

router.get('/sessions', videoController.getSessions);


router.delete('/terminate-session/:roomId', (req, res) => {
    const { roomId } = req.params;
    activeSessions = activeSessions.filter(s => s.roomId !== roomId);
    
    res.status(200).json({
        success: true,
        message: "Neural link terminated and cleared"
    });
});

router.post('/end-session', videoController.endSession);

module.exports = router;