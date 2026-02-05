import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    device_id: {
        type: String,
        required: true,
    },
    feedback: {
        type: String,
        required: true, 
        required: true, 
    },
    rating: {
        type: String,
        required: false,
        required: false,
        enum: ['very dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very satisfied'],
        default: 'neutral',
    },
    source: {
        type: String,
        required: false,
        enum: ['document', 'chatbot'],
        default: 'document',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;