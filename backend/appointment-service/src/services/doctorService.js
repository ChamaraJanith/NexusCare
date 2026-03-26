import axios from "axios";

export const searchDoctors = async (specialty) => {
  const res = await axios.get(
    `http://localhost:5002/api/doctors?specialty=${specialty}`
  );
  return res.data;
};