import { submitFeedback } from "../controllers/feedback_controller.js";
import express from 'express';

export const feedbackRouter = express.Router();

feedbackRouter.post('/submit', submitFeedback);
