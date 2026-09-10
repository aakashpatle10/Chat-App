const { createClient } = require("redis");

let redisClient = null;

const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  const password = process.env.REDIS_PASSWORD;

  if (!host || !port) {
    throw new Error(
      "Redis config missing. Set REDIS_URL or REDIS_HOST + REDIS_PORT in .env"
    );
  }

  return {
    socket: {
      host,
      port: Number(port),
    },
    ...(password ? { password } : {}),
  };
};

const connectRedis = async () => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  const config = getRedisConfig();
  redisClient = createClient(config);

  redisClient.on("error", (error) => {
    console.error("Redis error:", error.message);
  });

  await redisClient.connect();
  console.log("Redis connected");

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient?.isOpen) {
    throw new Error("Redis client is not connected");
  }

  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
