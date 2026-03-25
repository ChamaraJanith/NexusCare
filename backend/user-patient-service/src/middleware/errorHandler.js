// Global error handling middleware
// Must be last middleware added in app.js

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(". ");
  }

  // Handle Mongoose duplicate key error (e.g., duplicate email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Handle Mongoose CastError (invalid ID format)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format.";
  }

  // Handle multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size exceeds the allowed limit.";
  }

  console.error(`❌ Error [${statusCode}]: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;