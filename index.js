import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { feedbackRouter } from './routes/feedback_routes.js';
import { authRouter } from './routes/auth_routes.js';
import { authMiddleware } from './middleware/auth.js';
import cors from 'cors';
import connectDB from './config/db.js';

dotenv.config();
    
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        await connectDB();

        // Auth routes (public)
        app.use('/api/auth', authRouter);
        
        // Feedback routes - submit is public, dashboard routes are protected
        app.post('/api/feedback/submit', (req, res, next) => {
            // Import and call submitFeedback directly for public access
            import('./controllers/feedback_controller.js').then(module => {
                module.submitFeedback(req, res);
            });
        });
        
        // Protected dashboard routes
        app.use('/api/feedback', authMiddleware, feedbackRouter);

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    }
};

startServer();

export default app;