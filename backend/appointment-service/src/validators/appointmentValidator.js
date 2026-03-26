export const validateAppointment = (req, res, next) => {
  try {
    const { patientId, doctorId, date, time } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({
        error: "All fields are required (patientId, doctorId, date, time)"
      });
    }

    // 👉 simple date check
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    next();

  } catch (error) {
    console.error("Validation error:", error.message);
    res.status(500).json({ error: "Validation failed" });
  }
};

export const validateUpdateAppointment = (req, res, next) => {
  try {
    const { date, time, status } = req.body;

    // 👉 optional fields check (update එකේ required නෑ)
    if (date && isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const validStatus = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    next();

  } catch (error) {
    console.error("Update validation error:", error.message);
    res.status(500).json({ error: "Validation failed" });
  }
};