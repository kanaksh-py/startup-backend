import Post from '../model/Post.js';

const getGlobalFeed = async (req, res) => {
    try {
        // Ensure the path 'startup' matches the field name in your Post Schema
        const posts = await Post.find()
            .populate({
                path: 'startup', 
                select: 'name logo_url website_url' 
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export default getGlobalFeed;