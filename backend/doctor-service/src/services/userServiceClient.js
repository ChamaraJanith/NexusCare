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
    // Extract raw token from "Bearer xxxxx"
    const rawToken = bearerToken?.startsWith("Bearer ")
      ? bearerToken.split(" ")[1]
      : bearerToken;

    if (!rawToken) {
      console.error("[userServiceClient] No token provided");
      return null;
    }

    console.log("[userServiceClient] Calling POST /api/auth/verify-token");

    const response = await axios.post(
      `${USER_SERVICE_URL}/api/auth/verify-token`,
      { token: rawToken }
    );

    console.log("[userServiceClient] verify-token response:", response.data);

    // verify-token returns: { success, userId, roleId, role, name, email, isVerified }
    if (response.data?.success) {
      return {
        name: response.data.name,
        email: response.data.email,
        userId: response.data.userId,
        roleId: response.data.roleId,
        role: response.data.role,
        profileImage: response.data.profileImage || null,
      };
    }

    return null;
  } catch (err) {
    console.error(
      "[userServiceClient] verify-token failed:",
      err.response?.data || err.message
    );
    return null;
  }
};
