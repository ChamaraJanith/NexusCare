const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // 1. Mongoose import කරන්න
require('dotenv').config();

const videoRoutes = require('./routes/videoRoutes');
const videoService = require('./services/videoService');

const app = express();

app.use(cors());
app.use(express.json());

// 2. MongoDB Connection එක මෙතනට එකතු කරන්න
// .env ෆයිල් එකේ MONGO_URI=ඔයාගේ_url එක තියෙන්න ඕනේ
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexuscare_video'; 

mongoose.connect(mongoURI)
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    await videoService.bootstrapDoctorCatalog();
    videoService.scheduleDoctorCatalogBootstrap(Number(process.env.DOCTOR_BOOTSTRAP_INTERVAL_MS) || 60000);
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use('/api/video', videoRoutes);

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`🚀 MS4 Video Node Active on Port ${PORT}`);
});

module.exports = app;