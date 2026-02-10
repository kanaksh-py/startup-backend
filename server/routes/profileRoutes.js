import express from 'express';
import { getPublicProfile, searchProfiles, updateProfile } from '../controllers/profileController.js';
import authMiddleware, { publicAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. Specific routes MUST come first
// Changed to publicAuth so guests can use the search page too
router.get('/search', publicAuth, searchProfiles);

// 2. Dynamic ID routes MUST come after specific routes
router.get('/:id', publicAuth, getPublicProfile); 

// 3. Protected actions
router.put('/update', authMiddleware, updateProfile);

export default router;