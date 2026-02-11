import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    tagline: String,
    detailed_description: String,
    logo_url: String,
    website_url: String,
    
    // --- ADD THESE FIELDS HERE ---
    contact_phone: String, 
    contact_email: String,
    // ------------------------------

    founded_year: Number,
    legal_entity_name: String,
    company_registration_number: String, // not mandatory
    status: { 
        type: String, 
        enum: ['idea', 'MVP', 'early-stage', 'scaling', 'exited'],
        default: 'idea'
    },
    location: {
        city: String,
        state: String,
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
    socials: {
        linkedin_url: String,
        twitter_url: String,
        pitch_deck_url: String // instagram
    },
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