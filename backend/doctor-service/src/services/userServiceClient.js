import axios from "axios";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:5001";

/**
 * Calls user-patient-service POST /api/auth/verify-token
 * to get user identity (name, email) from the raw JWT token.
 *
 * This is the microservice-to-microservice pattern:
 * doctor-service sends the raw token → user-patient-service verifies & returns user data.
 */
export const getUserByToken = async (bearerToken) => {
  try {
    // 1. Extract token correctly
    const token = bearerToken?.split(" ")[1];

    if (!token) {
      console.error("[userServiceClient] No token provided");
      return null;
    }

    // 5. Add logging to debug token
    console.log("[userServiceClient] Sending token to user-service:", token);

    // 2. & 3. Send request with correct header to verify-token
    const response = await axios.post(
      `${USER_SERVICE_URL}/api/auth/verify-token`,
      { token },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // 5. Logging response
    console.log("[userServiceClient] verify-token response:", response.data);

    // 4. Return
    // (We natively map res.data.user if it exists, otherwise we safely default to the flat res.data structure MS1 provides)
    return response.data?.user || response.data;
  } catch (err) {
    console.error(
      "[userServiceClient] verify-token failed:",
      err.response?.data || err.message
    );
    return null;
  }
};

/**
 * Calls user-patient-service POST /api/auth/doctors/search
 * to retrieve a batch list of doctor identities (and their doctorIds)
 * matching the provided name.
 */
export const searchDoctorsByName = async (name) => {
  try {
    const response = await axios.post(
      `${USER_SERVICE_URL}/api/auth/doctors/search`,
      { name }
    );

    if (response.data?.success) {
      return response.data.data; // Array of { doctorId, name, profileImage }
    }
    return [];
  } catch (err) {
    console.error(
      "[userServiceClient] searchDoctorsByName failed:",
      err.response?.data || err.message
    );
    return [];
  }
};
