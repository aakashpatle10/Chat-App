const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getRedisClient } = require("../config/redis");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const redis = getRedisClient();
      const isBlacklisted = await redis.get(`blacklist:${token}`);

      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token invalidated",
        });
      }
    } catch {
      // Redis unavailable — continue with JWT verification only
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

module.exports = authMiddleware;
