import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// CREATE
export const createPrescription = async (data, user) => {
  if (user.role !== "doctor") {
    throw new Error("Only doctors can create prescriptions");
  }

  const { patientId, appointmentId, medications, diagnosis, notes } = data;

  if (!patientId || !appointmentId || !medications || !medications.length) {
    throw new Error("patientId, appointmentId, and medications are required");
  }

  const doctorId = user.doctorId || user.id;
  const doctorName = user.name || "Unknown Doctor";

  const internalKey = process.env.INTERNAL_SERVICE_KEY;
  const patientServiceUrl = process.env.USER_PATIENT_SERVICE_URL || "http://localhost:5001";

  try {
    const response = await axios.post(
      `${patientServiceUrl}/api/patient/prescriptions/add`,
      {
        prescriptionId: uuidv4(),
        patientId,
        doctorId,
        doctorName,
        appointmentId,
        medications,
        diagnosis,
        notes,
      },
      {
        headers: {
          "x-internal-service-key": internalKey,
        },
      }
    );

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    throw new Error(`Failed to forward prescription: ${errorMsg}`);
  }
};

// Stateless architecture: Doctor service should not directly read, update, or delete prescriptions
// If READ/UPDATE/DELETE is needed by doctor, it should also be forwarded via internal-service calls
// For now, these operate as pass-throughs or throw errors if unimplemented in patient service.

// READ
export const getByPatient = async (patientId) => {
  throw new Error("Fetching prescriptions via doctor-service is deprecated. Access via user-patient-service.");
};

// UPDATE
export const updatePrescription = async (id, data, user) => {
  throw new Error("Updating prescriptions is not currently supported in the stateless architecture.");
};

// SOFT DELETE
export const deletePrescription = async (id, user) => {
  throw new Error("Deleting prescriptions is not currently supported in the stateless architecture.");
};