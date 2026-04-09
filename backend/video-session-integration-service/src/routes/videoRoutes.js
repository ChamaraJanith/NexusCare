// videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const syncController = require('../controllers/syncController');
const validate = require('../middleware/validate');
const {
  initializeSessionSchema,
  endSessionSchema,
  syncDoctorSchema,
  syncDoctorIdSchema,
  appointmentIdSchema,
  terminateSessionSchema,
} = require('../validators/videoValidator');

router.post('/initialize-link', validate(initializeSessionSchema), videoController.initializeSession);
router.post('/end-session', validate(endSessionSchema), videoController.endSession);
router.post('/sync/doctor', syncController.verifyInternalKey, validate(syncDoctorSchema), syncController.upsertDoctor);
router.delete('/sync/doctor/:doctorId', syncController.verifyInternalKey, validate(syncDoctorIdSchema, 'params'), syncController.removeDoctor);
router.get('/doctors', videoController.getDoctors);
router.get('/health', videoController.healthCheck);
router.get('/sessions/appointment/:appointmentId', validate(appointmentIdSchema, 'params'), videoController.getSessionByAppointment);
router.get('/sessions', videoController.getSessions);
router.delete('/terminate-session/:roomId', validate(terminateSessionSchema, 'params'), videoController.terminateSession);

module.exports = router;
