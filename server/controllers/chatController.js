import mongoose from 'mongoose';
import Message from '../model/Message.js';

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
        const myId = req.profileId; 
        if (!myId) return res.status(401).json({ message: "Profile ID not found" });

        const myIdString = String(myId);
        const myIdObjectId = new mongoose.Types.ObjectId(myIdString);

        const conversations = await Message.aggregate([
            { 
                $match: { 
                    $or: [ 
                        { sender: myIdObjectId }, 
                        { conversationId: { $regex: myIdString } } 
                    ] 
                } 
            },
            { $sort: { createdAt: -1 } },
            { 
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$text" },
                    lastTimestamp: { $first: "$createdAt" },
                    sender: { $first: "$sender" }
                } 
            },
            { 
                $addFields: {
                    // This logic extracts the OTHER ID from the "ID_ID" string
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
            // Only proceed if a partnerId was successfully found
            { $match: { partnerId: { $exists: true, $ne: null } } },
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
                            { name: "Unknown User", logo_url: null } // Fallback
                        ]
                    }
                }
            },
            { $sort: { lastTimestamp: -1 } },
            { $project: { startupInfo: 0, incubatorInfo: 0, partnerObjectId: 0 } }
        ]);

        console.log(`Found ${conversations.length} conversations for ${myIdString}`);
        res.status(200).json(conversations);
    } catch (err) {
        console.error("Aggregation Error:", err);
        res.status(500).json({ error: err.message });
    }
};