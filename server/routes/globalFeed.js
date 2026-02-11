import getGlobalFeed from '../controllers/feedController.js';
import express from 'express';
import authMiddleware from '../middleware/auth.js'; // Added middleware

const router = express.Router();

// The path is /feed, and in server.js you use /api/myfeed
// So total path = /api/myfeed/feed
router.get('/feed', authMiddleware, getGlobalFeed);

export default router;