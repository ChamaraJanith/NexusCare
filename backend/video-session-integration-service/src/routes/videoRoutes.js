// videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const syncController = require('../controllers/syncController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  initializeSessionSchema,
  endSessionSchema,
  syncDoctorSchema,
  syncDoctorIdSchema,
  appointmentIdSchema,
  terminateSessionSchema,
} = require('../validators/videoValidator');

// Patient or doctor can start a session
router.post('/initialize-link', protect, restrictTo('patient', 'doctor'), validate(initializeSessionSchema), videoController.initializeSession);

// Patient or doctor can end a session
router.post('/end-session', protect, restrictTo('patient', 'doctor'), validate(endSessionSchema), videoController.endSession);

// Internal service sync routes (protected by internal key, not JWT)
router.post('/sync/doctor', syncController.verifyInternalKey, validate(syncDoctorSchema), syncController.upsertDoctor);
router.delete('/sync/doctor/:doctorId', syncController.verifyInternalKey, validate(syncDoctorIdSchema, 'params'), syncController.removeDoctor);

// Browse doctors — any authenticated user
router.get('/doctors', protect, videoController.getDoctors);

// Health check — public
router.get('/health', videoController.healthCheck);

// Session by appointment — patient or doctor
router.get('/sessions/appointment/:appointmentId', protect, restrictTo('patient', 'doctor'), validate(appointmentIdSchema, 'params'), videoController.getSessionByAppointment);

// All sessions — filtered by role (admin sees all, doctor/patient see their own)
router.get('/sessions', protect, videoController.getSessions);

// Terminate session — admin or doctor
router.delete('/terminate-session/:roomId', protect, restrictTo('admin', 'doctor'), validate(terminateSessionSchema, 'params'), videoController.terminateSession);

module.exports = router;
