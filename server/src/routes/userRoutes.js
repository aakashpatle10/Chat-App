const express = require("express");
const { getMe, searchUsers } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMe);
router.get("/search", searchUsers);

module.exports = router;
