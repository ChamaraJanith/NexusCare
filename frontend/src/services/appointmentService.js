import axios from "axios";

const API = "http://localhost:5003/api/appointments";

export const searchDoctors = async (filters) => {
  console.log("FILTERS:", filters);
  const res = await axios.get(`${API}/search`, { params: filters });
  console.log("DOCTORS FROM API:", res.data);
  return res.data;
};

export const getDoctorSlots = async (doctorId, date) => {
  const res = await axios.get(`${API}/doctor/${doctorId}/slots`, { params: { date } });
  return res.data;
};

export const getNextQueueNumber = async (doctorId, date) => {
  const res = await axios.get(`${API}/queue/next`, { params: { doctorId, date } });
  return res.data;
};

export const bookAppointment = async (data) => {
  const res = await axios.post(API, data);
  return res.data;
};

export const getMyAppointments = async (patientId) => {
  const res = await axios.get(`${API}/patient/${patientId}`);
  return res.data;
};

export const cancelAppointment = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};
