import * as doctorService from "../services/doctorService.js";

// GET Doctor by DoctorId (roleId)
export const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorByDoctorId(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found"
      });
    }

    res.json({
      success: true,
      data: doctor,
      message: "Doctor profile retrieved successfully"
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
      ...result,
      message: "Doctors retrieved successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// UPDATE Doctor Profile
export const updateDoctor = async (req, res) => {
  try {
    const requestedDoctorId = req.params.id;

    // Strict Ownership Validation
    if (requestedDoctorId !== req.user.doctorId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own profile"
      });
    }

    const updated = await doctorService.updateDoctorByDoctorId(requestedDoctorId, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found"
      });
    }

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