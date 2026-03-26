import axios from "axios";

export const verifyUser = async (token) => {
  try {
    const res = await axios.post(
      "http://localhost:5001/api/auth/verify-token",
      { token }
    );

    return res.data;

  } catch (error) {
    throw new Error("Unauthorized");
  }
};