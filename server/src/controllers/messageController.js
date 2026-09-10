const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");

const messageSenderPopulation = {
    path: "senderId",
    select: "name username avatar",
};

const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found",
        });
    }

    const conversation = await Conversation.exists({
        _id: conversationId,
        members: req.user._id,
    });

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found",
        });
    }

    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        Message.find({ conversationId })
            .populate(messageSenderPopulation)
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit),
        Message.countDocuments({ conversationId }),
    ]);

    res.json({
        success: true,
        data: {
            messages,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + messages.length < total,
            },
        },
    });
});

module.exports = { getMessages };