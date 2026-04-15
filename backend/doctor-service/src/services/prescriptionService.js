import Prescription from "../models/Prescription.js";

// CREATE
export const createPrescription = async (data, user) => {
  // 🔒 Authorization check
  if (!user || user.role !== "doctor") {
    throw new Error("Only doctors can create prescriptions");
  }

  const {
    patientId,
    appointmentId,
    diagnosis,
    symptoms,
    medicines,
    advice,
    followUpDate,
    notes
  } = data;

  // 🔒 Required fields validation
  if (!patientId || !medicines || !medicines.length || !diagnosis) {
    throw new Error("patientId, diagnosis, and medicines are required");
  }

  // 🔁 Normalize medicines (backward compatibility)
  const formattedMedicines = medicines.map((med) => {
    if (typeof med === "string") {
      return {
        name: med,
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      };
    }
    return med;
  });

  // 🔥 Doctor identity (ONLY from authenticated user)
  const doctorId = user.doctorId || user.id;

  const doctorName =
    user.name ||
    user.fullName;

  // ❗ Strict enforcement (no more "Unknown Doctor")
  if (!doctorName) {
    throw new Error("Doctor profile name missing in token");
  }

  try {
    const newPrescription = new Prescription({
      doctorId,
      doctorName,
      patientId,
      appointmentId,
      diagnosis,
      symptoms,
      medicines: formattedMedicines,
      advice,
      followUpDate,
      notes
    });

    const savedPrescription = await newPrescription.save();
    return savedPrescription;

  } catch (error) {
    throw new Error(`Failed to create prescription: ${error.message}`);
  }
};

// READ BY PATIENT
export const getByPatient = async (patientId) => {
  try {
    const prescriptions = await Prescription
      .find({ patientId, isDeleted: false })
      .sort({ createdAt: -1 });

    return prescriptions;

  } catch (error) {
    throw new Error(`Error fetching prescriptions: ${error.message}`);
  }
};

// UPDATE
export const updatePrescription = async () => {
  throw new Error("Updating prescriptions is not currently supported in this module.");
};

// DELETE
export const deletePrescription = async () => {
  throw new Error("Deleting prescriptions is not currently supported in this module.");
};