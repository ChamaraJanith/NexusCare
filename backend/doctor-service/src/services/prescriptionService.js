import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import Prescription from "../models/Prescription.js";

// CREATE
export const createPrescription = async (data, user) => {
  if (user.role !== "doctor") {
    throw new Error("Only doctors can create prescriptions");
  }

  const { patientId, appointmentId, diagnosis, symptoms, medicines, advice, followUpDate, notes } = data;

  if (!patientId || !medicines || !medicines.length || !diagnosis) {
    throw new Error("patientId, diagnosis, and medicines are required");
  }

  // Backwards compatibility: Map string arrays to structured object arrays
  const formattedMedicines = medicines.map((med) => {
    if (typeof med === "string") {
      return { name: med, dosage: "", frequency: "", duration: "", instructions: "" };
    }
    return med;
  });

  const doctorId = user.doctorId || user.id;

  // 🔥 FIX: robust doctorName resolution
  const doctorName =
    data.doctorName ||           // from frontend (highest priority)
    user.name ||                // from JWT
    user.fullName ||            // fallback field
    "Dr. Unknown";

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
    const prescriptions = await Prescription.find({ patientId, isDeleted: false }).sort({ createdAt: -1 });
    return prescriptions;
  } catch (error) {
    throw new Error(`Error fetching prescriptions: ${error.message}`);
  }
};

// UPDATE
export const updatePrescription = async (id, data, user) => {
  throw new Error("Updating prescriptions is not currently supported in this module.");
};

// SOFT DELETE
export const deletePrescription = async (id, user) => {
  throw new Error("Deleting prescriptions is not currently supported in this module.");
};