const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryAsync = async (fn, options = {}) => {
  const {
    retries = 3,
    initialDelayMs = 200,
    factor = 2,
    onRetry = () => {},
  } = options;

  let attempt = 0;
  let delayMs = initialDelayMs;
  let lastError;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= retries) {
        break;
      }
      await onRetry(attempt, delayMs, error);
      await delay(delayMs);
      delayMs = Math.round(delayMs * factor);
    }
  }

  throw lastError;
};

module.exports = {
  retryAsync,
  delay,
};
