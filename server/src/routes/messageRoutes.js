const express = require("express");
const { getMessages } = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:conversationId/messages", getMessages);

module.exports = router;