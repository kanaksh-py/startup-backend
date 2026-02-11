import express from 'express';
import { register, login, getStatus } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js'; 

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/status', authMiddleware, getStatus); 

export default router;