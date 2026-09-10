require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const { app, getAllowedOrigins } = require("./src/app");
const connectDB = require("./src/config/db");
const { connectRedis } = require("./src/config/redis");
const setupSocket = require("./src/socket/socketHandler");

const PORT = process.env.PORT || 5002;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
});

setupSocket(io);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
