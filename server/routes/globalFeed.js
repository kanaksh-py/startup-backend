import getGlobalFeed from '../controllers/feedController.js';
import express from 'express';

const router = express.Router();

router.get('/feed', getGlobalFeed);

export default router;