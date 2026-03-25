import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import doctorRoutes from "./routes/doctor.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/doctors", doctorRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

app.listen(5002, () => {
  console.log("Doctor Service running on port 5002");
});