import express from 'express';
import { displayAuth } from '../middleware/auth.js';
import { getSchedule } from '../controllers/scheduleController.js';

const router = express.Router();

// Public display route
router.get('/', displayAuth, getSchedule);

export default router;
