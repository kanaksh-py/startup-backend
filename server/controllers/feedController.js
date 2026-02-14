// server/controllers/feedController.js
import Post from '../model/Post.js';
// MUST IMPORT THESE TO REGISTER SCHEMAS FOR POPULATION
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';

const getGlobalFeed = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate({
                path: 'author', 
                // Fetches the actual data from either Startup or Incubator collection
                select: 'name logo_url slug' 
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: posts });
    } catch (err) {
        console.error("Feed Populate Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export default getGlobalFeed;