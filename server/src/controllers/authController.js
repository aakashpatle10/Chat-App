const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const { getRedisClient } = require("../config/redis");
const { setUserOnline, setUserOffline } = require("../utils/presence");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name?.trim() || !username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      success: false,
      message: "Username must be 3-20 characters (letters, numbers, underscore)",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });

  if (existingUser) {
    const message =
      existingUser.email === normalizedEmail
        ? "Email already registered"
        : "Username already taken";

    return res.status(400).json({
      success: false,
      message,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
  });

  const token = generateToken(user._id);
  await setUserOnline(user._id);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: { ...user.toPublicJSON(), isOnline: true },
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = generateToken(user._id);
  await setUserOnline(user._id);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: { ...user.toPublicJSON(), isOnline: true },
      token,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(400).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttlSeconds > 0) {
      const redis = getRedisClient();
      await redis.set(`blacklist:${token}`, "1", { EX: ttlSeconds });
    }

    await setUserOffline(decoded.id);
  } catch {
    // Token already invalid — still return success for client cleanup
  }

  res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = { register, login, logout };
