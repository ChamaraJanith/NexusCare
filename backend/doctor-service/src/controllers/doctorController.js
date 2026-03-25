import * as doctorService from "../services/doctorService.js";

// CREATE Doctor Profile
export const createDoctor = async (req, res) => {
  try {
    // 🔥 Prevent duplicate profile
    const existing = await doctorService.getDoctorByUserId(req.user.id);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Doctor profile already exists"
      });
    }

    const doctor = await doctorService.createDoctorProfile({
      ...req.body,
      userId: req.user.id,
      doctorId: req.user.doctorId // 🔥 from auth token
    });

    res.status(201).json({
      success: true,
      data: doctor,
      message: "Doctor profile created successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// GET Doctor by ID
export const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      data: doctor
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 🔍 SEARCH + FILTER
export const searchDoctors = async (req, res) => {
  try {
    const result = await doctorService.searchDoctors(req.query);

    res.json({
      success: true,
      ...result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// UPDATE Doctor
export const updateDoctor = async (req, res) => {
  try {
    const existingDoctor = await doctorService.getDoctorById(req.params.id);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    if (existingDoctor.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const updated = await doctorService.updateDoctor(req.params.id, req.body);

    res.json({
      success: true,
      data: updated,
      message: "Doctor profile updated"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// DELETE Doctor
export const deleteDoctor = async (req, res) => {
  try {
    const existingDoctor = await doctorService.getDoctorById(req.params.id);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    if (existingDoctor.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    await doctorService.deleteDoctor(req.params.id);

    res.json({
      success: true,
      message: "Doctor profile deleted"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};