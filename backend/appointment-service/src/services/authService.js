import axios from "axios";

export const verifyUser = async (token) => {
  try {
    const res = await axios.post(
      "http://localhost:5001/api/auth/verify-token",
      { token }
    );

    // 🔥 HANDLE BOTH STRUCTURES
    return res.data.user || res.data;

  } catch (error) {
    console.error("Auth error:", error.response?.data || error.message);
    throw new Error("Unauthorized");
  }
};