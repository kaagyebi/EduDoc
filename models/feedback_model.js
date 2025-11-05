import mongoose from 'mongoose';


const feedbackSchema = new mongoose.Schema({
    device_id: {
        type: String,
        required: true,
    },
    feedback: {
        type: String,
        required: true,
    },
    rating: {
        type: String,
        enum: ['very dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very satisfied'],
        default: 'neutral',
    },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
