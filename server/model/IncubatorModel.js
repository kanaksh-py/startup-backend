import mongoose from 'mongoose';

const IncubatorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    description: String,
    logo_url: String,
    website_url: String,
    organization_type: { type: String, enum: ['incubator', 'accelerator', 'VC-backed', 'government'] },
    location: {
        city: String,
        state: String,
        country: String
    },
    focus: {
        industries: [String],
        stages: [String]
    },
    programDetails: {
        duration_weeks: Number,
        equity_taken: Number,
        funding_offered: String
    },
    services: {
        office_space: Boolean,
        mentorship: Boolean,
        cloud_credits: Boolean
    }
}, { timestamps: true });

export default mongoose.model('Incubator', IncubatorSchema);