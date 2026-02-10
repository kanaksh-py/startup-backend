import express from 'express';
import { getRecentConversations, getMessages } from '../controllers/chatController.js';
import authMiddleware from '../middleware/auth.js'; // Use your auth middleware name

const router = express.Router();

router.get('/recent', authMiddleware, getRecentConversations);
router.get('/:conversationId', authMiddleware, getMessages);

export default router;