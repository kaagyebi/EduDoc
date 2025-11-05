import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { feedbackRouter } from './routes/feedback_routes.js';
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

        app.use('/api/feedback', feedbackRouter);

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