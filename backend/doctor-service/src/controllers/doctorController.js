import * as doctorService from "../services/doctorService.js";

// CREATE Doctor Profile
export const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.createDoctorProfile({
      ...req.body,
      userId: req.user.id // 🔥 get from token
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

    if (!doctor || doctor.isDeleted) {
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

// UPDATE Doctor (only owner)
export const updateDoctor = async (req, res) => {
  try {
    const existingDoctor = await doctorService.getDoctorById(req.params.id);

    if (!existingDoctor || existingDoctor.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // 🔐 Ownership check
    if (existingDoctor.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile"
      });
    }

    const updated = await doctorService.updateDoctor(req.params.id, req.body);

    res.json({
      success: true,
      data: updated,
      message: "Doctor profile updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ❌ DELETE Doctor (SOFT DELETE)
export const deleteDoctor = async (req, res) => {
  try {
    const existingDoctor = await doctorService.getDoctorById(req.params.id);

    if (!existingDoctor || existingDoctor.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // 🔐 Ownership check
    if (existingDoctor.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this profile"
      });
    }

    await doctorService.deleteDoctor(req.params.id); // soft delete

    res.json({
      success: true,
      message: "Doctor profile deleted (soft delete)"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};