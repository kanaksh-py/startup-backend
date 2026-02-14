import mongoose from 'mongoose';
import Message from '../model/MessageModel.js';

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getRecentConversations = async (req, res) => {
    try {
        // Ensure we are working with a string for the regex and a clean ObjectId for lookups
        const myIdString = req.profileId.toString();
        
        const conversations = await Message.aggregate([
            // 1. Find all messages where the current user's ID is part of the room name
            { $match: { conversationId: { $regex: myIdString } } },
            { $sort: { createdAt: -1 } },
            // 2. Group by room to get the latest message from each contact
            { 
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$text" },
                    lastTimestamp: { $first: "$createdAt" },
                    sender: { $first: "$sender" }
                } 
            },
            // 3. Extract the OTHER ID from the "ID1_ID2" string
            { 
                $addFields: {
                    partnerId: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: { $split: ["$_id", "_"] },
                                    as: "part",
                                    cond: { $ne: ["$$part", myIdString] }
                                }
                            },
                            0
                        ]
                    }
                } 
            },
            // 4. Convert string ID back to ObjectId for MongoDB Lookup
            { $addFields: { partnerObjectId: { $toObjectId: "$partnerId" } } },
            {
                $lookup: {
                    from: "startups",
                    localField: "partnerObjectId",
                    foreignField: "_id",
                    as: "startupInfo"
                }
            },
            {
                $lookup: {
                    from: "incubators",
                    localField: "partnerObjectId",
                    foreignField: "_id",
                    as: "incubatorInfo"
                }
            },
            {
                $addFields: {
                    partnerDetails: {
                        $ifNull: [
                            { $arrayElemAt: ["$startupInfo", 0] },
                            { $arrayElemAt: ["$incubatorInfo", 0] },
                            { name: "Unknown User", logo_url: null }
                        ]
                    }
                }
            },
            { $sort: { lastTimestamp: -1 } },
            { $project: { startupInfo: 0, incubatorInfo: 0, partnerObjectId: 0 } }
        ]);

        res.status(200).json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};