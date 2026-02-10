import { 
    submitFeedback, 
    getDashboardStats, 
    getRatingsDistribution, 
    getVolumeTrend, 
    getAllFeedback, 
    getRecentFeedback,
    getSourceDistribution 
} from "../controllers/feedback_controller.js";
import express from 'express';

export const feedbackRouter = express.Router();

// Existing route
feedbackRouter.post('/submit', submitFeedback);

// New dashboard routes
feedbackRouter.get('/dashboard-stats', getDashboardStats);
feedbackRouter.get('/ratings-distribution', getRatingsDistribution);
feedbackRouter.get('/volume-trend', getVolumeTrend);
feedbackRouter.get('/source-distribution', getSourceDistribution);
feedbackRouter.get('/recent', getRecentFeedback);
feedbackRouter.get('/', getAllFeedback);
