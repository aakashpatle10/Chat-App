const express = require("express");
const {
    getConversations,
    getConversation,
    createDirectConversation,
    createGroupConversation,
} = require("../controllers/conversationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConversations);
router.get("/:id", getConversation);
router.post("/direct", createDirectConversation);
router.post("/group", createGroupConversation);

module.exports = router;