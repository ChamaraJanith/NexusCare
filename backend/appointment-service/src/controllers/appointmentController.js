export const bookAppointment = async (req, res) => {
  try {
    // 👉 dummy logic (later DB logic add කරන්න)
    const data = req.body;

    res.status(201).json({
      message: "Appointment booked successfully",
      data
    });

  } catch (error) {
    console.error("Error booking appointment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    res.status(200).json({
      message: "Appointments fetched",
      patientId
    });

  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    res.status(200).json({
      message: "Appointment updated",
      id,
      updatedData
    });

  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      message: "Appointment cancelled",
      id
    });

  } catch (error) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};