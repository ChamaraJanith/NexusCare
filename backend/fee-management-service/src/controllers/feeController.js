const axios = require("axios");
const ServiceFee = require("../models/ServiceFee");
const Hospital = require("../models/Hospital");

const ensureServiceFee = async () => {
  const existing = await ServiceFee.findOne({ key: "global" });
  if (!existing) {
    await ServiceFee.create({ key: "global", amount: 500, description: "Platform service fee" });
  }
};

// GET /api/service-fee
const getServiceFee = async (req, res, next) => {
  try {
    await ensureServiceFee();
    const fee = await ServiceFee.findOne({ key: "global" });
    res.json({ success: true, data: fee });
  } catch (err) { next(err); }
};

// PUT /api/service-fee  (admin only)
const updateServiceFee = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ success: false, message: "amount is required." });
    }
    await ensureServiceFee();
    const updated = await ServiceFee.findOneAndUpdate(
      { key: "global" },
      { amount: Number(amount), description: description || "Platform service fee" },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: updated, message: "Service fee updated." });
  } catch (err) { next(err); }
};

// POST /api/service-fee/calculate  (internal — called by MS3)
// Body: { doctorId, hospitalId?, appointmentType }
const calculateFee = async (req, res, next) => {
  try {
    const { doctorId, hospitalId, appointmentType } = req.body;

    if (!doctorId || !appointmentType) {
      return res.status(400).json({
        success: false,
        message: "doctorId and appointmentType are required.",
      });
    }

    // 1. Get service fee (global)
    await ensureServiceFee();
    const serviceFeeDoc = await ServiceFee.findOne({ key: "global" });
    const serviceFee = serviceFeeDoc?.amount ?? 500;

    // 2. Get doctor's consultationFee directly from MS1's DoctorProfile
    //    MS1 exposes /api/auth/verify-token which returns specialty+hospital.
    //    But to get consultationFee we call MS1's admin or internal endpoint.
    //    MS1 has GET /api/admin/users/:userId — but we have doctorId (DOC-0001).
    //    The cleanest pattern: call MS1's internal doctor lookup endpoint.
    let doctorFee = 2000; // safe fallback
    try {
      const ms1Url = process.env.MS1_URL || "http://localhost:5001";
      const { data } = await axios.get(
        `${ms1Url}/api/auth/doctors/fee/${doctorId}`,
        {
          headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
          timeout: 5000,
        }
      );
      if (data.success && data.consultationFee !== undefined) {
        doctorFee = data.consultationFee;
      }
    } catch (err) {
      console.error("❌ Could not fetch doctor fee from MS1, using fallback:", err.message);
    }

    // 3. Hospital fee — only for PHYSICAL appointments
    let hospitalFee = 0;
    if (appointmentType === "PHYSICAL" && hospitalId) {
      const hospitalDoc = await Hospital.findOne({ hospitalId, isActive: true });
      hospitalFee = hospitalDoc?.hospitalFee ?? 0;
    }

    const total = doctorFee + hospitalFee + serviceFee;

    res.json({
      success: true,
      data: { doctorFee, hospitalFee, serviceFee, total, appointmentType },
    });
  } catch (err) { next(err); }
};

module.exports = { getServiceFee, updateServiceFee, calculateFee };