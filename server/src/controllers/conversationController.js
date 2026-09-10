const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const conversationPopulation = {
    path: "members",
    select: "name username avatar isOnline lastSeen",
};

const getDirectKey = (firstUserId, secondUserId) =>
    [String(firstUserId), String(secondUserId)].sort().join(":");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ members: req.user._id })
        .populate(conversationPopulation)
        .sort({ updatedAt: -1 });

    res.json({
        success: true,
        data: { conversations },
    });
});

const getConversation = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found",
        });
    }

    const conversation = await Conversation.findOne({
        _id: req.params.id,
        members: req.user._id,
    }).populate(conversationPopulation);

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found",
        });
    }

    res.json({
        success: true,
        data: { conversation },
    });
});

const createDirectConversation = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: "A valid userId is required",
        });
    }

    if (String(req.user._id) === String(userId)) {
        return res.status(400).json({
            success: false,
            message: "You cannot create a conversation with yourself",
        });
    }

    const otherUser = await User.findById(userId).select("_id");

    if (!otherUser) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    const directKey = getDirectKey(req.user._id, otherUser._id);
    let conversation = await Conversation.findOne({ directKey });

    if (!conversation) {
        try {
            conversation = await Conversation.create({
                type: "direct",
                members: [req.user._id, otherUser._id],
                createdBy: req.user._id,
            });
        } catch (error) {
            if (error.code !== 11000) {
                throw error;
            }

            conversation = await Conversation.findOne({ directKey });
        }
    }

    conversation = await conversation.populate(conversationPopulation);

    res.status(201).json({
        success: true,
        data: { conversation },
    });
});

const createGroupConversation = asyncHandler(async (req, res) => {
    const name = req.body.name?.trim();
    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];

    if (!name || name.length > 80) {
        return res.status(400).json({
            success: false,
            message: "Group name is required and must be 80 characters or fewer",
        });
    }

    const uniqueMemberIds = [
        ...new Set(
            memberIds
                .map(String)
                .filter((memberId) => memberId !== String(req.user._id))
        ),
    ];

    if (!uniqueMemberIds.length) {
        return res.status(400).json({
            success: false,
            message: "At least one other member is required",
        });
    }

    if (uniqueMemberIds.some((memberId) => !isValidObjectId(memberId))) {
        return res.status(400).json({
            success: false,
            message: "All memberIds must be valid user IDs",
        });
    }

    const users = await User.find({ _id: { $in: uniqueMemberIds } }).select("_id");

    if (users.length !== uniqueMemberIds.length) {
        return res.status(404).json({
            success: false,
            message: "One or more users were not found",
        });
    }

    const conversation = await Conversation.create({
        type: "group",
        name,
        members: [req.user._id, ...uniqueMemberIds],
        createdBy: req.user._id,
    });

    await conversation.populate(conversationPopulation);

    res.status(201).json({
        success: true,
        data: { conversation },
    });
});

module.exports = {
    getConversations,
    getConversation,
    createDirectConversation,
    createGroupConversation,
};