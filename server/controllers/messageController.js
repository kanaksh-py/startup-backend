import Conversation from '../model/ConversationModel.js';
import Message from '../model/MessageModel.js';

// 1. Get or Create a Conversation (Initializes the room)
export const getConversation = async (req, res) => {
    try {
        const { myId, targetId, targetRole } = req.body; // Add targetRole to body from frontend
        const roomKey = [myId, targetId].sort().join("_");
        let conversation = await Conversation.findOne({ roomKey });
        if (!conversation) {
            conversation = new Conversation({
                roomKey,
                participants: [myId, targetId],
                // Since we are building an ecosystem, we assume participants 
                // are Startups or Incubators. You can refine this logic:
                participantModel: 'Startup' // Defaulting to Startup for safety, or pass from frontend
            });
            await conversation.save();
        }

        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
        res.json({ conversation, messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Get list of all active chats for the sidebar
export const getChatList = async (req, res) => {
    try {
        const { myId } = req.params;
        
        const conversations = await Conversation.find({ participants: myId })
            .populate({
                path: 'participants',
                // This targets both Startup and Incubator models automatically
                select: 'name logo_url slug' 
            })
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Save a message to DB
export const saveMessage = async (req, res) => {
    try {
        const { conversationId, senderId, text } = req.body;
        const message = new Message({ conversationId, senderId, text });
        await message.save();

        // Update the last message in conversation for the sidebar
        await Conversation.findByIdAndUpdate(conversationId, { 
            lastMessage: text,
            updatedAt: Date.now()
        });

        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};