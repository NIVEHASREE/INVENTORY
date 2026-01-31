module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  // If Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: message, errors });
  }
  // Duplicate key
  if (err.code && err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key error", details: err.keyValue });
  }
  res.status(status).json({ message });
};