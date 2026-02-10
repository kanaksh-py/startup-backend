import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // We remove 'ref' here to allow both Incubator and Startup IDs
        // Or you can use 'refPath' if you want to be advanced, but this is safer for now.
    },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', MessageSchema);