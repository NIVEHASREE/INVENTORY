require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getActiveUri } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/suppliers", require("./routes/supplierRoutes"));
app.use("/api/supplies", require("./routes/supplyRoutes"));

// Health check endpoint
const mongoose = require("mongoose");
app.get("/health", (req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1, state: mongoose.connection.readyState });
});

// DB info endpoint (useful for connecting Compass)
app.get("/db-info", (req, res) => {
  try {
    const uri = getActiveUri();
    res.json({ uri, readyState: mongoose.connection.readyState, host: mongoose.connection.host, port: mongoose.connection.port });
  } catch (e) {
    res.status(500).json({ message: "Unable to read DB info", error: e.message });
  }
});

// Centralized error handler (should be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);