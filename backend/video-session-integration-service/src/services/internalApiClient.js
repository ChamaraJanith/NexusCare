const axios = require('axios');

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.INTERNAL_SERVICE_KEY_FALLBACK;

const createInternalApiClient = (baseUrl) => {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      ...(INTERNAL_SERVICE_KEY ? { 'x-internal-service-key': INTERNAL_SERVICE_KEY } : {}),
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        return Promise.reject(error);
      }
      if (error.request) {
        return Promise.reject(new Error(`No response from ${baseUrl}`));
      }
      return Promise.reject(error);
    }
  );

  return client;
};

module.exports = { createInternalApiClient };
