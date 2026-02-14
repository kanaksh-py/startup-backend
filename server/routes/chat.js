import express from 'express';
import { 
    getConversation, 
    getChatList, 
    saveMessage 
} from '../controllers/messageController.js';
import authMiddleware from '../middleware/auth.js'; 

const router = express.Router();

// Get list of all active chats for the sidebar
// Frontend calls: api.get(`/messages/list/${myId}`)
router.get('/list/:myId', authMiddleware, getChatList);

// Initialize or Fetch a room between two specific IDs
// Frontend calls: api.post('/messages/get-or-create', { myId, targetId })
router.post('/get-or-create', authMiddleware, getConversation);

// Save a new message (Triggered alongside the socket emit)
// Frontend calls: api.post('/messages/save', messageData)
router.post('/save', authMiddleware, saveMessage);

export default router;