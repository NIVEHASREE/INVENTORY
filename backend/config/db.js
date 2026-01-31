const mongoose = require("mongoose");
let MongoMemoryServer = null;
try {
  MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
} catch (e) {
  // optional dependency
}

const DEFAULT_URI = "mongodb://127.0.0.1:27017/senthil_electricals";
const MONGO_URI = process.env.MONGO_URI || DEFAULT_URI;

// Keep track of the actual uri in use (real or memory server)
let _activeUri = MONGO_URI;
let _mongodInstance = null;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    _activeUri = MONGO_URI;
    console.log("MongoDB connected", MONGO_URI);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // if we're in development try a memory server fallback
    if (process.env.NODE_ENV !== "production" && MongoMemoryServer) {
      try {
        console.log("Starting in-memory MongoDB (mongodb-memory-server) for development...");
        _mongodInstance = await MongoMemoryServer.create();
        const uri = _mongodInstance.getUri();
        _activeUri = uri;
        await mongoose.connect(uri);
        console.log("Connected to in-memory MongoDB", uri);
        return;
      } catch (memErr) {
        console.error("In-memory MongoDB failed:", memErr);
      }
    }

    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

const getActiveUri = () => _activeUri;

const stopInMemory = async () => {
  if (_mongodInstance) {
    try {
      await _mongodInstance.stop();
      _mongodInstance = null;
      console.log("Stopped in-memory MongoDB");
    } catch (e) {
      console.warn("Error stopping in-memory MongoDB:", e);
    }
  }
};

module.exports = { connectDB, getActiveUri, stopInMemory };

