const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { getRedisClient } = require("./config/redis");
const errorHandler = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;

  if (!origins) {
    return ["http://localhost:3000"];
  }

  return origins
    .split(/[,|]/)
    .map((origin) => origin.trim())
    .filter(Boolean);
};

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", async (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  let redisStatus = "disconnected";

  try {
    const redis = getRedisClient();
    await redis.ping();
    redisStatus = "connected";
  } catch {
    redisStatus = "disconnected";
  }

  res.json({
    success: true,
    message: "Server is running",
    data: {
      mongo: mongoStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(errorHandler);

module.exports = app;
