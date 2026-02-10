import express from 'express';
import { login, verifyAuth, setupAdmin } from '../controllers/auth_controller.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = express.Router();

// Public routes
authRouter.post('/login', login);
authRouter.post('/setup', setupAdmin); // One-time setup

// Protected route
authRouter.get('/verify', authMiddleware, verifyAuth);
