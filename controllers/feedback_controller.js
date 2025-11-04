import Feedback from "../models/feedback_model.js";


export const submitFeedback = async (req, res) => {
    try {
        const { message } = req.body;

        // Add validation for the message
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: "Message is required and cannot be empty." });
        }

        const newFeedback = new Feedback({ message });
        await newFeedback.save();
        res.status(201).json({ message: "Feedback submitted successfully." });
    } catch (error) {
        // Log the actual error on the server for debugging purposes
        console.error("Error submitting feedback:", error);
        // Send a generic error message to the client
        res.status(500).json({ error: "Failed to submit feedback." });
    }
};