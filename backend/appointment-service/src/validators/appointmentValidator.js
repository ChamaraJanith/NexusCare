// 🔥 STEP 3 UPDATED VALIDATOR

export const validateAppointment = (req, res, next) => {
  try {
    const {
      doctorId,
      date,
      time,
      appointmentType,
      patientName,
      email,
      phone,
      age,
      gender
    } = req.body;

    // 🔥 Required fields
    if (!doctorId || !date || !time || !appointmentType) {
      return res.status(400).json({
        error: "doctorId, date, time, appointmentType are required"
      });
    }

    // 🔥 Validate appointment type
    const validTypes = ["ONLINE", "PHYSICAL"];
    if (!validTypes.includes(appointmentType)) {
      return res.status(400).json({
        error: "appointmentType must be ONLINE or PHYSICAL"
      });
    }

    // 🔥 Validate date
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({
        error: "Invalid date format"
      });
    }

    // 🔥 OPTIONAL (but recommended) patient validation
    if (patientName && patientName.length < 2) {
      return res.status(400).json({
        error: "Patient name must be at least 2 characters"
      });
    }

    if (email && !email.includes("@")) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }

    if (phone && phone.length < 10) {
      return res.status(400).json({
        error: "Invalid phone number"
      });
    }

    if (age && (age < 0 || age > 120)) {
      return res.status(400).json({
        error: "Invalid age"
      });
    }

    const validGenders = ["Male", "Female", "Other"];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({
        error: "Gender must be Male, Female or Other"
      });
    }

    next();

  } catch (error) {
    console.error("Validation error:", error.message);
    res.status(500).json({ error: "Validation failed" });
  }
};


// 🔥 UPDATE VALIDATION
export const validateUpdateAppointment = (req, res, next) => {
  try {
    const { date, time, status, appointmentType } = req.body;

    // 🔥 Date validation
    if (date && isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // 🔥 Status validation
    const validStatus = ["PENDING", "VERIFIED", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // 🔥 Appointment type validation
    if (appointmentType) {
      const validTypes = ["ONLINE", "PHYSICAL"];
      if (!validTypes.includes(appointmentType)) {
        return res.status(400).json({
          error: "appointmentType must be ONLINE or PHYSICAL"
        });
      }
    }

    next();

  } catch (error) {
    console.error("Update validation error:", error.message);
    res.status(500).json({ error: "Validation failed" });
  }
};