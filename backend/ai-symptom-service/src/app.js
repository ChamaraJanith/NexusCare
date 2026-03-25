const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const symptomRoutes = require("./routes/symptomRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ai-symptom-checker" });
});

app.use("/api/ai", symptomRoutes);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`AI Symptom Checker Service running on port ${PORT}`);
});