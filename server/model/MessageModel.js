import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    conversationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Conversation', 
        required: true, 
        index: true 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    text: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);