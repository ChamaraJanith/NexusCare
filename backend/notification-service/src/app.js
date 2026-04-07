const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
connectDB().catch(err => {
  console.error('❌ Notification DB connection failed:', err.message);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
    console.log(`🔔 Notification Service Active on Port ${PORT}`);
});