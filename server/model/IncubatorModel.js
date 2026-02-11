import mongoose from 'mongoose';

const IncubatorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, unique: true, trim: true }, // Added Unique
    slug: { type: String, unique: true, lowercase: true, trim: true }, // Added Slug
    description: String,
    logo_url: String,
    website_url: String,
    founded_year: Number,
    organization_type: { 
        type: String, 
        enum: ['incubator', 'accelerator', 'VC-backed', 'government'] 
    },
    operating_status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    
    location: {
        city: String,
        state: String,
        country: String,
        coverage_area: { type: String, enum: ['local', 'national', 'global'] },
        remote_program_available: { type: Boolean, default: false }
    },

    focus: {
        industries_supported: [String],
        stage_focus: [String],
        specializations: [String]
    },

    programDetails: {
        program_name: String,
        duration_weeks: Number,
        cohort_size: Number,
        cohorts_per_year: Number,
        equity_taken_percentage: Number,
        funding_offered_amount: String,
        program_format: { type: String, enum: ['in-person', 'remote', 'hybrid'] },
        mentorship_offered: { type: Boolean, default: false },
        corporate_partners: [String]
    },

    applicationInfo: {
        application_open_dates: String,
        deadline: Date,
        selection_criteria: String,
        application_link: String,
        rolling_applications: { type: Boolean, default: false }
    },

    services: {
        office_space: { type: Boolean, default: false },
        cloud_credits: { type: Boolean, default: false },
        legal_support: { type: Boolean, default: false },
        investor_demo_day: { type: Boolean, default: false },
        prototyping_labs: { type: Boolean, default: false },
        marketing_support: { type: Boolean, default: false }
    },

    trackRecord: {
        number_of_startups_supported: { type: Number, default: 0 },
        total_follow_on_funding: String
    },

    socials: {
        linkedin_url: String,
        twitter_url: String,
        contact_email: String,
        contact_phone: String
    },

    verified_partner: { type: Boolean, default: false },
    last_active: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-generate slug before saving
IncubatorSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    next();
});

export default mongoose.model('Incubator', IncubatorSchema);