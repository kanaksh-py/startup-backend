import Post from '../model/Post.js';
import User from '../model/UserModel.js';
import Startup from '../model/StartupModel.js';
import cloudinary from '../config/cloudinary.js';

const createPost = async (req, res) => {
    try {
        const { content, image } = req.body;
        
        // 1. Find User and Profile
        const user = await User.findById(req.startupId).populate('startupProfile');

        if (!user || user.role !== 'startup' || !user.startupProfile) {
            return res.status(403).json({ message: "Valid startup profile required to post." });
        }

        const profile = user.startupProfile;

        // 2. 7-DAY LIMIT LOGIC (Fixed & Accurate)
        if (profile.lastPostDate) {
            const now = new Date();
            const lastPost = new Date(profile.lastPostDate);
            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
            const diff = now.getTime() - lastPost.getTime();

            if (diff < oneWeekInMs) {
                const timeLeft = oneWeekInMs - diff;
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                let timeMsg = days > 0 ? `${days} day(s)` : `${hours} hour(s)`;
                
                return res.status(429).json({ 
                    success: false,
                    message: `Weekly limit reached. You can post again in ${timeMsg}.` 
                });
            }
        }

        // 3. Upload image
        let imageUrl = '';
        if (image) {
            const uploadRes = await cloudinary.uploader.upload(image, { folder: 'startup_posts' });
            imageUrl = uploadRes.secure_url;
        }

        // 4. Save the Post
        const newPost = new Post({
            startup: profile._id, 
            content,
            image: imageUrl
        });
        await newPost.save();

        // 5. UPDATE PROFILE (Resets the timer)
        profile.lastPostDate = new Date();
        profile.operating_status = 'active'; 
        await profile.save();

        return res.status(201).json({ success: true, data: newPost });
    } catch (err) {
        console.error("POST ERROR:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

export default createPost;