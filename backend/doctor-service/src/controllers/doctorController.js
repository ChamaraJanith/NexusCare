import * as doctorService from "../services/doctorService.js";

export const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.createDoctorProfile(req.body);
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    await doctorService.deleteDoctor(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
