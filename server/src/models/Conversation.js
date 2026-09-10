const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["direct", "group"],
            required: true,
        },
        name: {
            type: String,
            trim: true,
            default: "",
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        directKey: {
            type: String,
            unique: true,
            sparse: true,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ members: 1, updatedAt: -1 });

conversationSchema.pre("validate", function setDirectKey() {
    if (this.type === "direct" && this.members?.length !== 2) {
        throw new Error("Direct conversations require exactly two members");
    }

    if (this.type === "direct") {
        this.directKey = this.members.map(String).sort().join(":");
    } else if (this.type === "group") {
        this.directKey = undefined;
    }
});

module.exports = mongoose.model("Conversation", conversationSchema);