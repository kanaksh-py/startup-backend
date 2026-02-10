import express from 'express';
import { getPublicProfile, searchProfiles, updateProfile } from '../controllers/profileController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// 1. UPDATE: Removed authMiddleware from the public profile route
// This allows anyone with the link to view the profile
router.get('/:id', getPublicProfile); 

// 2. Keep these protected
router.put('/update', authMiddleware, updateProfile);
router.get('/search', authMiddleware, searchProfiles);

export default router;