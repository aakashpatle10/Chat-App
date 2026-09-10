const User = require("../models/User");
const { getRedisClient } = require("../config/redis");

const onlineKey = (userId) => `online:${userId}`;

const setUserOnline = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    isOnline: true,
    lastSeen: new Date(),
  });

  try {
    const redis = getRedisClient();
    await redis.set(onlineKey(userId), "1");
  } catch {
    // MongoDB remains source of truth if Redis is unavailable
  }
};

const setUserOffline = async (userId) => {
  const lastSeen = new Date();

  await User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen,
  });

  try {
    const redis = getRedisClient();
    await redis.del(onlineKey(userId));
  } catch {
    // Ignore Redis errors during offline update
  }

  return lastSeen;
};

const isUserOnline = async (userId) => {
  try {
    const redis = getRedisClient();
    const status = await redis.get(onlineKey(userId));
    return status === "1";
  } catch {
    const user = await User.findById(userId).select("isOnline");
    return user?.isOnline || false;
  }
};

const attachOnlineStatus = async (users) => {
  return Promise.all(
    users.map(async (user) => {
      const publicUser = user.toPublicJSON ? user.toPublicJSON() : user;
      const online = await isUserOnline(publicUser._id);

      return {
        ...publicUser,
        isOnline: online,
      };
    })
  );
};

module.exports = {
  setUserOnline,
  setUserOffline,
  isUserOnline,
  attachOnlineStatus,
};
