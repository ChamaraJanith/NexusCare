const express = require("express");
const router = express.Router();
const controller = require("../controllers/appointmentController");

router.post("/", controller.bookAppointment);
router.get("/:patientId", controller.getAppointments);
router.put("/:id", controller.updateAppointment);
router.delete("/:id", controller.cancelAppointment);

module.exports = router;