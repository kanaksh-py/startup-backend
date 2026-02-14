// server/controllers/postController.js
import Post from '../model/Post.js';
import User from '../model/UserModel.js';
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';
import cloudinary from '../config/cloudinary.js';

export const createPost = async (req, res) => {
    try {
        const { content, image } = req.body;
        
        // Use req.userId (from authMiddleware) to find the person posting
        const user = await User.findById(req.userId).populate('startupProfile incubatorProfile');
        if (!user) return res.status(404).json({ message: "Identity sync failed." });

        const isStartup = user.role === 'startup';
        const profile = isStartup ? user.startupProfile : user.incubatorProfile;

        if (!profile) {
            return res.status(403).json({ message: "Active profile required to broadcast." });
        }

        // 7-DAY LIMIT LOGIC
        if (profile.lastPostDate) {
            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
            const diff = Date.now() - new Date(profile.lastPostDate).getTime();
            if (diff < oneWeekInMs) {
                return res.status(429).json({ message: "Cooldown active. One transmission per week." });
            }
        }

        let imageUrl = '';
        if (image) {
            const uploadRes = await cloudinary.uploader.upload(image, { folder: 'ecosystem_posts' });
            imageUrl = uploadRes.secure_url;
        }

        const newPost = new Post({
            author: profile._id,
            authorModel: isStartup ? 'Startup' : 'Incubator', // This MUST match the Model name
            content,
            image: imageUrl
        });
        
        await newPost.save();

        profile.lastPostDate = new Date();
        profile.operating_status = 'active'; 
        await profile.save();

        return res.status(201).json({ success: true, data: newPost });
    } catch (err) {
        console.error("POST ERROR:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const toggleUpvote = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found." });

        // Toggle logic using the User ObjectID
        const userId = req.userId;
        const index = post.upvotes.indexOf(userId);
        
        if (index === -1) {
            post.upvotes.push(userId);
        } else {
            post.upvotes.splice(index, 1);
        }

        await post.save();
        res.json({ success: true, upvotes: post.upvotes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};