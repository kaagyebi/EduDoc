import Feedback from "../models/feedback_model.js";

// Submit feedback
export const submitFeedback = async (req, res) => {
    try {
        const { device_id, feedback, rating } = req.body;

        // Validate presence of auto-generated device_id and feedback
        if (!device_id || !feedback) {
            return res.status(400).json({ error: "Device ID and feedback are required." });
        }

        const newFeedback = new Feedback({
            device_id,
            feedback,
            rating,
        });

        await newFeedback.save();
        return res.status(201).json({
            message: "Feedback submitted successfully.",
            data: newFeedback,
        });

    } catch (error) {
        console.error("Error submitting feedback:", error);
        return res.status(500).json({ error: "Failed to submit feedback." });
    }
};
