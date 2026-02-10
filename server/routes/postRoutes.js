import express from 'express';
import createPost from '../controllers/postController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// POST /api/posts
router.post('/', authMiddleware, createPost);

export default router;