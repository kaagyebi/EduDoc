import Feedback from "../models/feedback_model.js";

// Submit feedback
export const submitFeedback = async (req, res) => {
    try {
        const { device_id, feedback, rating, source } = req.body;

        // Validate presence of auto-generated device_id and feedback
        if (!device_id || !feedback) {
            return res.status(400).json({ error: "Device ID and feedback are required." });
        }

        const newFeedback = new Feedback({
            device_id,
            feedback,
            rating,
            source: source || 'document', // Default to 'document' if not specified
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

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Total feedback count
        const totalFeedback = await Feedback.countDocuments();

        // Active sessions today (unique device_ids today)
        const activeSessions = await Feedback.distinct('device_id', {
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // Previous month comparison for total feedback
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthFeedback = await Feedback.countDocuments({
            createdAt: { $gte: lastMonth, $lt: new Date() }
        });

        // Previous day comparison for active sessions
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdaySessions = await Feedback.distinct('device_id', {
            createdAt: { $gte: yesterday, $lt: today }
        });

        // Calculate percentage changes
        const feedbackGrowth = lastMonthFeedback > 0 ? 
            ((totalFeedback - lastMonthFeedback) / lastMonthFeedback * 100).toFixed(1) : 0;
        const sessionGrowth = yesterdaySessions.length > 0 ? 
            ((activeSessions.length - yesterdaySessions.length) / yesterdaySessions.length * 100).toFixed(1) : 0;

        return res.status(200).json({
            totalFeedback,
            activeSessions: activeSessions.length,
            feedbackGrowth: `${feedbackGrowth >= 0 ? '+' : ''}${feedbackGrowth}%`,
            sessionGrowth: `${sessionGrowth >= 0 ? '+' : ''}${sessionGrowth}%`
        });

    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        return res.status(500).json({ error: "Failed to get dashboard statistics." });
    }
};

// Get ratings distribution for donut chart
export const getRatingsDistribution = async (req, res) => {
    try {
        const distribution = await Feedback.aggregate([
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map ratings to dashboard categories
        let satisfied = 0;
        let neutral = 0;
        let dissatisfied = 0;
        let total = 0;

        distribution.forEach(item => {
            const count = item.count;
            total += count;
            
            switch (item._id) {
                case 'very satisfied':
                case 'satisfied':
                    satisfied += count;
                    break;
                case 'neutral':
                    neutral += count;
                    break;
                case 'dissatisfied':
                case 'very dissatisfied':
                    dissatisfied += count;
                    break;
            }
        });

        // Calculate percentages
        const satisfiedPercent = total > 0 ? Math.round((satisfied / total) * 100) : 0;
        const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
        const dissatisfiedPercent = total > 0 ? Math.round((dissatisfied / total) * 100) : 0;

        // Calculate average score (1-5 scale)
        const scoreMapping = {
            'very dissatisfied': 1,
            'dissatisfied': 2,
            'neutral': 3,
            'satisfied': 4,
            'very satisfied': 5
        };

        let totalScore = 0;
        distribution.forEach(item => {
            totalScore += (scoreMapping[item._id] || 3) * item.count;
        });
        const averageScore = total > 0 ? (totalScore / total).toFixed(1) : 3.0;

        return res.status(200).json({
            satisfied: satisfiedPercent,
            neutral: neutralPercent,
            dissatisfied: dissatisfiedPercent,
            averageScore,
            totalResponses: total
        });

    } catch (error) {
        console.error("Error getting ratings distribution:", error);
        return res.status(500).json({ error: "Failed to get ratings distribution." });
    }
};

// Get feedback volume trend for line chart
export const getVolumeTrend = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysCount = parseInt(days);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysCount);
        startDate.setHours(0, 0, 0, 0);

        const trend = await Feedback.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Fill in missing days with 0 counts
        const result = [];
        for (let i = daysCount - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dayData = trend.find(item => 
                item._id.year === date.getFullYear() &&
                item._id.month === date.getMonth() + 1 &&
                item._id.day === date.getDate()
            );

            result.push({
                date: date.toISOString().split('T')[0],
                count: dayData ? dayData.count : 0,
                label: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error getting volume trend:", error);
        return res.status(500).json({ error: "Failed to get volume trend." });
    }
};

// Get all feedback with pagination and filtering
export const getAllFeedback = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            rating = '', 
            source = '',
            dateFrom = '',
            dateTo = ''
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { device_id: { $regex: search, $options: 'i' } },
                { feedback: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (rating) {
            if (rating === 'satisfied') {
                filter.rating = { $in: ['satisfied', 'very satisfied'] };
            } else if (rating === 'dissatisfied') {
                filter.rating = { $in: ['dissatisfied', 'very dissatisfied'] };
            } else if (rating === 'neutral') {
                filter.rating = 'neutral';
            }
        }
        
        if (source) {
            filter.source = source;
        }
        
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDate;
            }
        }

        // Get total count for pagination
        const total = await Feedback.countDocuments(filter);
        
        // Get feedback with pagination
        const feedback = await Feedback.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get message counts per device_id
        const deviceIds = feedback.map(f => f.device_id);
        const messageCounts = await Feedback.aggregate([
            { $match: { device_id: { $in: deviceIds } } },
            { $group: { _id: "$device_id", count: { $sum: 1 } } }
        ]);

        // Map message counts
        const messageCountMap = {};
        messageCounts.forEach(item => {
            messageCountMap[item._id] = item.count;
        });

        // Format response data
        const formattedFeedback = feedback.map(item => ({
            id: item._id,
            sessionId: item.device_id,
            user: `User ${item.device_id.slice(-4)}`,
            feedback: item.feedback,
            rating: mapRatingToSentiment(item.rating),
            source: item.source,
            messageCount: messageCountMap[item.device_id] || 1,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        return res.status(200).json({
            feedback: formattedFeedback,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error("Error getting all feedback:", error);
        return res.status(500).json({ error: "Failed to get feedback." });
    }
};

// Get recent feedback for dashboard table
export const getRecentFeedback = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const recentFeedback = await Feedback.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        // Get message counts for each device
        const deviceIds = recentFeedback.map(f => f.device_id);
        const messageCounts = await Feedback.aggregate([
            { $match: { device_id: { $in: deviceIds } } },
            { $group: { _id: "$device_id", count: { $sum: 1 } } }
        ]);

        const messageCountMap = {};
        messageCounts.forEach(item => {
            messageCountMap[item._id] = item.count;
        });

        // Format for dashboard
        const formatted = recentFeedback.map(item => ({
            id: item._id,
            user: `User ${item.device_id.slice(-4)}`,
            rating: mapRatingToSentiment(item.rating),
            comment: item.feedback.length > 60 ? 
                item.feedback.substring(0, 60) + '...' : item.feedback,
            date: getTimeAgo(item.createdAt),
            status: 'New' // Default status since we don't have this field
        }));

        return res.status(200).json(formatted);

    } catch (error) {
        console.error("Error getting recent feedback:", error);
        return res.status(500).json({ error: "Failed to get recent feedback." });
    }
};

// Helper function to map rating to sentiment
function mapRatingToSentiment(rating) {
    const mapping = {
        'very satisfied': { label: 'Satisfied', color: 'emerald', icon: 'sentiment_satisfied_alt' },
        'satisfied': { label: 'Satisfied', color: 'emerald', icon: 'sentiment_satisfied_alt' },
        'neutral': { label: 'Neutral', color: 'amber', icon: 'sentiment_neutral' },
        'dissatisfied': { label: 'Dissatisfied', color: 'rose', icon: 'sentiment_dissatisfied' },
        'very dissatisfied': { label: 'Dissatisfied', color: 'rose', icon: 'sentiment_dissatisfied' }
    };
    return mapping[rating] || mapping['neutral'];
}

// Helper function to get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} secs ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}
