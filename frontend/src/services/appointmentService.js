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

export const getDoctorSlotsNext30Days = async (doctorId) => {
  try {
    const today = new Date();
    const requests = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split("T")[0];

      requests.push(
        axios.get(`${API}/doctor/${doctorId}/slots`, {
          params: { date: dateStr }
        })
      );
    }

    const responses = await Promise.all(requests);

    const physical = [];
    const online = [];

    responses.forEach(res => {
      if (res.data.physical) physical.push(...res.data.physical);
      if (res.data.online) online.push(...res.data.online);
    });

    // 🔥 MEKA THAMAI OYA AHU WENA THANATA DANNA ONA
    physical.sort((a, b) => new Date(a.date) - new Date(b.date));
    online.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { physical, online };

  } catch (error) {
    console.error("❌ ERROR fetching 30-day slots:", error.message);
    throw error;
  }
};