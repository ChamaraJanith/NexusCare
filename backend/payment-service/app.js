const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");
const paymentRoutes = require("./src/routes/paymentRoutes");

connectDB();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Important: PayHere webhook sends form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "MS5 - Payment Service",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/payments", paymentRoutes);

// Simple error handler (copy full one from MS1 if needed)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5009;
app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on port ${PORT}`);
});

module.exports = app;