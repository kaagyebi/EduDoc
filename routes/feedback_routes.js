import { submitFeedback } from "../controllers/feedback_controller";
import express from 'express';

export const feedbackRouter = express.Router();

feedbackRouter.post('/submit', submitFeedback);
