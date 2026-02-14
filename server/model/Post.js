// server/model/Post.js
import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        refPath: 'authorModel',
        index: true 
    },
    authorModel: {
        type: String,
        required: true,
        enum: ['Startup', 'Incubator']
    },
    content: { type: String, required: true },
    image: { type: String }, 
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Post', PostSchema);