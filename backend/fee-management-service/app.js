const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./src/config/db");
const hospitalRoutes = require("./src/routes/hospitalRoutes");
const feeRoutes = require("./src/routes/feeRoutes");

connectDB();

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-internal-service-key"],
}));
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, service: "MS6 - Fee Management Service", status: "running" });
});

app.use("/api/hospitals", hospitalRoutes);
app.use("/api/service-fee", feeRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => console.log(`🚀 Fee Management Service on port ${PORT}`));
module.exports = app;