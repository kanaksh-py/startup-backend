import express from 'express';
import { createPost, toggleUpvote } from '../controllers/postController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// POST /api/posts - Create a new transmission
router.post('/', authMiddleware, createPost);

// POST /api/posts/upvote/:id - Toggle upvote
router.post('/upvote/:id', authMiddleware, toggleUpvote);

export default router;