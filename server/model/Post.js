import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    startup: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Startup', 
        required: true 
    },
    content: { type: String, required: true },
    image: { type: String }, 
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Post', PostSchema);
// upvote