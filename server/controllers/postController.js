import Post from '../model/Post.js';
import User from '../model/UserModel.js';
import cloudinary from '../config/cloudinary.js';

const createPost = async (req, res) => {
    try {
        const { content, image } = req.body;
        
        // 1. Find the User and their specific Startup Profile
        const user = await User.findById(req.startupId).populate('startupProfile');

        if (!user || user.role !== 'startup') {
            return res.status(403).json({ message: "Only startups can create posts." });
        }

        if (!user.startupProfile) {
            return res.status(404).json({ message: "Startup profile not found." });
        }

        // --- NEW: 7-DAY LIMIT LOGIC ---
        const lastPost = user.startupProfile.lastPostDate;
        if (lastPost) {
            const now = new Date();
            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
            const timeSinceLastPost = now - new Date(lastPost);

            if (timeSinceLastPost < oneWeekInMs) {
                const msRemaining = oneWeekInMs - timeSinceLastPost;
                const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
                const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));

                return res.status(429).json({ 
                    message: `You can only post once a week. Please wait ${daysRemaining} more day(s) (approx ${hoursRemaining} hours).` 
                });
            }
        }
        // ------------------------------

        // 2. Upload image to Cloudinary if exists
        let imageUrl = '';
        if (image) {
            const uploadRes = await cloudinary.uploader.upload(image, {
                folder: 'startup_posts'
            });
            imageUrl = uploadRes.secure_url;
        }

        // 3. Create the post using the Startup Profile ID
        const newPost = new Post({
            startup: user.startupProfile._id, 
            content,
            image: imageUrl
        });

        await newPost.save();

        // 4. Update the Startup Profile's last post date
        user.startupProfile.lastPostDate = new Date();
        await user.startupProfile.save();

        res.status(201).json({ success: true, data: newPost });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export default createPost;