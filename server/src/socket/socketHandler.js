const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { getRedisClient } = require("../config/redis");
const { setUserOnline, setUserOffline } = require("../utils/presence");

const activeSocketKey = (userId) => `active-sockets:${userId}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;
const fallbackSocketCounts = new Map();

const getSocketToken = (socket) => {
    const token = socket.handshake.auth?.token;

    if (typeof token !== "string" || !token) {
        throw new Error("Socket authentication required");
    }

    return token;
};

const isBlacklisted = async (token) => {
    try {
        const redis = getRedisClient();
        return Boolean(await redis.get(`blacklist:${token}`));
    } catch {
        return false;
    }
};

const authenticateSocket = async (socket, next) => {
    try {
        const token = getSocketToken(socket);

        if (await isBlacklisted(token)) {
            return next(new Error("Socket authentication failed"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(new Error("Socket authentication failed"));
        }

        socket.user = user;
        socket.token = token;
        next();
    } catch {
        next(new Error("Socket authentication failed"));
    }
};

const trackSocket = async (socket) => {
    const userId = String(socket.user._id);
    const fallbackCount = (fallbackSocketCounts.get(userId) || 0) + 1;
    fallbackSocketCounts.set(userId, fallbackCount);

    try {
        const redis = getRedisClient();
        await redis.sAdd(activeSocketKey(userId), socket.id);
    } catch {
        // The in-memory count keeps local presence working if Redis is unavailable.
    }

    await setUserOnline(socket.user._id);
};

const untrackSocket = async (socket) => {
    const userId = String(socket.user._id);
    const fallbackCount = Math.max((fallbackSocketCounts.get(userId) || 1) - 1, 0);

    if (fallbackCount === 0) {
        fallbackSocketCounts.delete(userId);
    } else {
        fallbackSocketCounts.set(userId, fallbackCount);
    }

    let hasActiveSockets = fallbackCount > 0;

    try {
        const redis = getRedisClient();
        await redis.sRem(activeSocketKey(userId), socket.id);
        hasActiveSockets = (await redis.sCard(activeSocketKey(userId))) > 0;

        if (!hasActiveSockets) {
            await redis.del(activeSocketKey(userId));
        }
    } catch {
        // Fall back to the in-memory count when Redis is unavailable.
    }

    if (!hasActiveSockets) {
        await setUserOffline(socket.user._id);
    }
};

const getMemberConversation = async (userId, conversationId) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return null;
    }

    return Conversation.findOne({
        _id: conversationId,
        members: userId,
    });
};

const sendError = (callback, message) => {
    if (typeof callback === "function") {
        callback({ success: false, message });
    }
};

const setupSocket = (io) => {
    io.use(authenticateSocket);

    io.on("connection", async (socket) => {
        await trackSocket(socket);

        socket.on("join_conversation", async (conversationId, callback) => {
            const conversation = await getMemberConversation(
                socket.user._id,
                conversationId
            );

            if (!conversation) {
                return sendError(callback, "Conversation not found");
            }

            socket.join(conversationRoom(conversationId));
            if (typeof callback === "function") {
                callback({ success: true });
            }
        });

        socket.on("leave_conversation", (conversationId) => {
            if (mongoose.Types.ObjectId.isValid(conversationId)) {
                socket.leave(conversationRoom(conversationId));
            }
        });

        socket.on("send_message", async (payload, callback) => {
            const conversationId = payload?.conversationId;
            const text = typeof payload?.text === "string" ? payload.text.trim() : "";

            if (!text || text.length > 5000) {
                return sendError(callback, "Message text must be between 1 and 5000 characters");
            }

            const conversation = await getMemberConversation(
                socket.user._id,
                conversationId
            );

            if (!conversation) {
                return sendError(callback, "Conversation not found");
            }

            const message = await Message.create({
                conversationId,
                senderId: socket.user._id,
                text,
            });

            await Conversation.findByIdAndUpdate(conversationId, {
                $set: { updatedAt: new Date() },
            });

            await message.populate({
                path: "senderId",
                select: "name username avatar",
            });

            io.to(conversationRoom(conversationId)).emit("receive_message", message);

            if (typeof callback === "function") {
                callback({ success: true, message });
            }
        });

        socket.on("disconnect", async () => {
            try {
                await untrackSocket(socket);
            } catch (error) {
                console.error("Failed to update socket presence:", error.message);
            }
        });
    });
};

module.exports = setupSocket;