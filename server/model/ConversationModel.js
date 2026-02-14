// server/model/ConversationModel.js
import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    roomKey: { type: String, required: true, unique: true },
    participants: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        refPath: 'participantModel' // This tells Mongoose to look at the field below
    }],
    participantModel: {
        type: String,
        required: true,
        enum: ['Startup', 'Incubator'] // Must match your model export names exactly
    },
    lastMessage: { type: String },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Conversation', ConversationSchema);