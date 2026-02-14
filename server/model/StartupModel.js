import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    tagline: { type: String, trim: true },
    detailed_description: { type: String },
    logo_url: { type: String },
    website_url: { type: String },
    
    // Connectivity
    contact_phone: String, 
    contact_email: String,

    founded_year: Number,
    legal_entity_name: String,
    company_registration_number: String,
    
    status: { 
        type: String, 
        enum: ['idea', 'MVP', 'early-stage', 'scaling', 'exited'],
        default: 'idea'
    },

    location: {
        address_line: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
        remote_friendly: { type: Boolean, default: false }
    },

    industry: {
        primary: String,
        niche: String,
        problem_statement: String,
        target_market: { type: String, enum: ['B2B', 'B2C', 'B2G'] },
        customer_segment: String
    },

    product: {
        stage: { type: String, enum: ['concept', 'prototype', 'beta', 'live'] },
        business_model: String,
        revenue_model: String,
        ip_status: { type: String, enum: ['none', 'filed', 'granted'] }
    },

    funding: {
        stage: String,
        total_amount: { type: Number, default: 0 },
        key_investors: String
    },

    team: {
        size: { type: Number, default: 1 },
        hiring: { type: Boolean, default: false }
    },

    needs: {
        seeking_incubation: { type: Boolean, default: false },
        seeking_funding: { type: Boolean, default: false },
        seeking_partners: { type: Boolean, default: false },
        seeking_mentors: { type: Boolean, default: false }
    },

    // 2026 Expanded Socials
    socials: {
        linkedin_url: String,
        twitter_url: String,
        instagram_url: String,
        medium_url: String,
        github_url: String,
        pitch_deck_url: String,
        discord_invite: String
    },

    // System Fields for Feed & Status
    lastPostDate: { type: Date }, 
    operating_status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

startupSchema.pre('save', async function() {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
});

export default mongoose.model('Startup', startupSchema);