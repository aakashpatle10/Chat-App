const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { attachOnlineStatus, isUserOnline } = require("../utils/presence");

const getMe = asyncHandler(async (req, res) => {
  const online = await isUserOnline(req.user._id);

  res.json({
    success: true,
    data: {
      user: {
        ...req.user.toPublicJSON(),
        isOnline: online,
      },
    },
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.q?.trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  if (query.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search query must be at least 2 characters",
    });
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ name: regex }, { username: regex }],
  })
    .select("-password")
    .limit(20)
    .sort({ name: 1 });

  const usersWithStatus = await attachOnlineStatus(users);

  res.json({
    success: true,
    data: {
      users: usersWithStatus,
    },
  });
});

module.exports = { getMe, searchUsers };
