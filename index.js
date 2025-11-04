import express from 'express';
import mongoose from 'mongoose';
import feedbackRouter from './routes/feedback_routes.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
    
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        const mongo_URI = process.env.MONGO_URI;
        await mongoose.connect(mongo_URI);
        console.log("Successfully connected to MongoDB.");

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