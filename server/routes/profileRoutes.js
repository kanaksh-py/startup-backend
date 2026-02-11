import express from 'express';
import { getPublicProfile, searchProfiles, updateProfile } from '../controllers/profileController.js';
import authMiddleware, { publicAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. ALL specific paths MUST be at the top
router.put('/update', authMiddleware, updateProfile); // Put this first
router.get('/search', publicAuth, searchProfiles);

// 2. The dynamic ID route MUST be last
router.get('/:id', publicAuth, getPublicProfile); 

export default router;