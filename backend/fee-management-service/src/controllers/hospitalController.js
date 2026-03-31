const Hospital = require("../models/Hospital");

const createHospital = async (req, res, next) => {
  try {
    const { name, location, contactNumber, email, hospitalFee } = req.body;
    if (!name || hospitalFee === undefined) {
      return res.status(400).json({ success: false, message: "name and hospitalFee are required." });
    }
    const exists = await Hospital.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (exists) {
      return res.status(400).json({ success: false, message: "Hospital with this name already exists." });
    }
    const hospital = await Hospital.create({
      name,
      location: location || "",
      contactNumber: contactNumber || "",
      email: email || "",
      hospitalFee: Number(hospitalFee),
    });
    res.status(201).json({ success: true, data: hospital });
  } catch (err) { next(err); }
};

const getAllHospitals = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active === "true") filter.isActive = true;
    const hospitals = await Hospital.find(filter).sort({ name: 1 });
    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err) { next(err); }
};

const getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ hospitalId: req.params.hospitalId });
    if (!hospital) return res.status(404).json({ success: false, message: "Hospital not found." });
    res.json({ success: true, data: hospital });
  } catch (err) { next(err); }
};

const updateHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ hospitalId: req.params.hospitalId });
    if (!hospital) return res.status(404).json({ success: false, message: "Hospital not found." });

    const { name, location, contactNumber, email, hospitalFee, isActive } = req.body;
    if (name !== undefined) hospital.name = name;
    if (location !== undefined) hospital.location = location;
    if (contactNumber !== undefined) hospital.contactNumber = contactNumber;
    if (email !== undefined) hospital.email = email;
    if (hospitalFee !== undefined) hospital.hospitalFee = Number(hospitalFee);
    if (isActive !== undefined) hospital.isActive = isActive;

    await hospital.save();
    res.json({ success: true, data: hospital, message: "Hospital updated." });
  } catch (err) { next(err); }
};

const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ hospitalId: req.params.hospitalId });
    if (!hospital) return res.status(404).json({ success: false, message: "Hospital not found." });
    await Hospital.deleteOne({ hospitalId: req.params.hospitalId });
    res.json({ success: true, message: "Hospital deleted." });
  } catch (err) { next(err); }
};

module.exports = { createHospital, getAllHospitals, getHospital, updateHospital, deleteHospital };