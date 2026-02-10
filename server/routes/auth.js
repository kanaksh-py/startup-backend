import express from 'express';
import { register, login, getStatus } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js'; // Ensure the path is correct

const router = express.Router();

// Existing routes
router.post('/register', register);
router.post('/login', login);

// ADD THIS LINE: It must match what Feed.jsx is calling
router.get('/status', authMiddleware, getStatus); 

export default router;