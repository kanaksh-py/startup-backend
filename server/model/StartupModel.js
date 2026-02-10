import mongoose from 'mongoose';

const StartupSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    tagline: String,
    detailed_description: String,
    logo_url: String,
    website_url: String,
    founded_year: Number,
    legal_entity_name: String,
    status: { type: String, enum: ['idea', 'MVP', 'early-stage', 'scaling', 'exited'], default: 'idea' },
    location: {
        city: String,
        state: String,
        country: String
    },
    industry: {
        primary: String,
        secondary: [String],
        problem_statement: String
    },
    funding: {
        stage: String,
        total_amount: Number,
        last_round: Date
    },
    lookingFor: {
        seeking_incubation: { type: Boolean, default: false },
        seeking_funding: { type: Boolean, default: false }
    },
    lastPostDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Startup', StartupSchema);