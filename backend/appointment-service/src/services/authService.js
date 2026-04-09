import axios from "axios";

export const verifyUser = async (token) => {
  try {
    const res = await axios.post(
      `${process.env.USER_SERVICE_URL || "http://user-patient-service:5001"}/api/auth/verify-token`,
      { token }
    );

    // 🔥 HANDLE BOTH STRUCTURES
    return res.data.user || res.data;

  } catch (error) {
    console.error("Auth error:", error.response?.data || error.message);
    throw new Error("Unauthorized");
  }
};