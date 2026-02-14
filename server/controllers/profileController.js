// server/controllers/profileController.js
import mongoose from 'mongoose';
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';
import Post from '../model/Post.js';
import cloudinary from '../config/cloudinary.js';

/**
 * GET PUBLIC PROFILE
 * Fetches profile by slug (URL-friendly name)
 */
export const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params; 
        console.log("Backend receiving ID/Slug:", id); // ADD THIS LOG

        // Check if ID is a valid 24-char hex string
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const query = isObjectId ? { _id: id } : { slug: id };

        let profile = await Startup.findOne(query);
        let role = 'startup';

        if (!profile) {
            profile = await Incubator.findOne(query);
            role = 'incubator';
        }

        if (!profile) {
            console.log("No profile found for query:", query); // ADD THIS LOG
            return res.status(404).json({ message: "Profile not found" });
        }

        const posts = role === 'startup' ? await Post.find({ startup: profile._id }).sort({ createdAt: -1 }) : [];

        res.json({ profile, role, posts });
    } catch (err) {
        console.error("Backend Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * SEARCH PROFILES
 * Used by the Navbar search bar
 */
export const searchProfiles = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ results: [] });

        const searchRegex = new RegExp(query, 'i');

        const [startups, incubators] = await Promise.all([
            Startup.find({ name: searchRegex }).select('name logo_url slug'),
            Incubator.find({ name: searchRegex }).select('name logo_url slug')
        ]);

        const allResults = [
            ...startups.map(s => ({ ...s._doc, role: 'startup' })),
            ...incubators.map(i => ({ ...i._doc, role: 'incubator' }))
        ];

        const uniqueResults = Array.from(
            new Map(allResults.map(item => [item._id.toString(), item])).values()
        );

        res.json({ results: uniqueResults });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * UPDATE PROFILE
 * Updates own profile using profileId from auth middleware
 */
export const updateProfile = async (req, res) => {
    try {
        const myId = req.profileId; 
        const d = req.body;
        const updateFields = {};
        
        // 1. Handle Cloudinary Image Upload
        if (d.logo && d.logo.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploader.upload(d.logo, { folder: 'logos' });
            updateFields.logo_url = uploadRes.secure_url;
        }

        // 2. Handle Slug Update if name changes
        if (d.name) {
            updateFields.slug = d.name
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
        }

        // 3. Map Flat Frontend Form to Database Structure
        if (req.role === 'startup') {
            const fields = [
                'name', 'tagline', 'detailed_description', 'website_url', 'founded_year',
                'legal_entity_name', 'company_registration_number', 'status', 'primary_industry',
                'niche', 'problem_statement', 'target_market', 'customer_segment', 'product_stage',
                'business_model', 'revenue_model', 'ip_status', 'funding_stage', 'total_funding_amount',
                'monthly_revenue_range', 'number_of_customers', 'growth_metrics', 'team_size', 
                'hiring', 'contact_phone', 'contact_email', 'visibility'
            ];

            fields.forEach(f => {
                if (d[f] !== undefined) updateFields[f] = d[f];
            });

            // Map Nested Location
            if (d.city !== undefined) updateFields['location.city'] = d.city;
            if (d.state !== undefined) updateFields['location.state'] = d.state;
            if (d.country !== undefined) updateFields['location.country'] = d.country;
            if (d.remote_friendly !== undefined) updateFields['location.remote_friendly'] = d.remote_friendly === true || d.remote_friendly === 'true';

            // --- UPDATED SOCIALS MAPPING (STARTUP) ---
            if (d.linkedin_url !== undefined) updateFields['socials.linkedin_url'] = d.linkedin_url;
            if (d.twitter_url !== undefined) updateFields['socials.twitter_url'] = d.twitter_url;
            if (d.instagram_url !== undefined) updateFields['socials.instagram_url'] = d.instagram_url;
            if (d.github_url !== undefined) updateFields['socials.github_url'] = d.github_url;
            if (d.discord_invite !== undefined) updateFields['socials.discord_invite'] = d.discord_invite;
            if (d.medium_url !== undefined) updateFields['socials.medium_url'] = d.medium_url;
            if (d.pitch_deck_url !== undefined) updateFields['socials.pitch_deck_url'] = d.pitch_deck_url;

        } else {
            // Incubator Mapping Logic
            const fields = ['name', 'description', 'website_url', 'founded_year', 'organization_type', 'operating_status', 'contact_phone', 'contact_email'];
            fields.forEach(f => {
                if (d[f] !== undefined) updateFields[f] = d[f];
            });

            if (d.city !== undefined) updateFields['location.city'] = d.city;
            if (d.country !== undefined) updateFields['location.country'] = d.country;
            if (d.equity_taken_percentage !== undefined) updateFields['programDetails.equity_taken_percentage'] = d.equity_taken_percentage;
            
            // --- UPDATED SOCIALS MAPPING (INCUBATOR) ---
            if (d.linkedin_url !== undefined) updateFields['socials.linkedin_url'] = d.linkedin_url;
            if (d.twitter_url !== undefined) updateFields['socials.twitter_url'] = d.twitter_url;
            if (d.instagram_url !== undefined) updateFields['socials.instagram_url'] = d.instagram_url;
            if (d.github_url !== undefined) updateFields['socials.github_url'] = d.github_url;
            if (d.discord_invite !== undefined) updateFields['socials.discord_invite'] = d.discord_invite;
            if (d.medium_url !== undefined) updateFields['socials.medium_url'] = d.medium_url;
            if (d.pitch_deck_url !== undefined) updateFields['socials.pitch_deck_url'] = d.pitch_deck_url;
        }

        const Model = req.role === 'startup' ? Startup : Incubator;

        // 4. Update Database using $set to prevent overwriting whole objects
        const profile = await Model.findByIdAndUpdate(
            myId, 
            { $set: updateFields }, 
            { new: true, runValidators: true }
        );

        if (!profile) return res.status(404).json({ message: "Update failed: Profile not found" });

        res.json({ success: true, profile });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(400).json({ error: err.message });
    }
};