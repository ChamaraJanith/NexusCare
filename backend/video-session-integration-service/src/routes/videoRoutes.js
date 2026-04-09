// videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const validate = require('../middleware/validate');
const {
  initializeSessionSchema,
  endSessionSchema,
  syncDoctorSchema,
  syncDoctorIdSchema,
} = require('../validators/videoValidator');

let activeSessions = [];

router.post('/initialize-link', validate(initializeSessionSchema), videoController.initializeSession);
router.post('/sync/doctor', validate(syncDoctorSchema), videoController.syncDoctor);
router.delete('/sync/doctor/:doctorId', validate(syncDoctorIdSchema, 'params'), videoController.removeDoctor);
router.get('/doctors', videoController.getDoctors);
router.get('/health', videoController.healthCheck);
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