// server/controllers/profileController.js
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';
import Post from '../model/Post.js';
import cloudinary from '../config/cloudinary.js';

export const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        // Check startups first
        let profile = await Startup.findById(id);
        let role = 'startup';

        if (!profile) {
            profile = await Incubator.findById(id);
            role = 'incubator';
        }

        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // If it's a startup, get their posts too
        const posts = role === 'startup' ? await Post.find({ startup: id }).sort({ createdAt: -1 }) : [];

        res.json({ profile, role, posts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const searchProfiles = async (req, res) => {
    try {
        const { query } = req.query;
        const searchRegex = new RegExp(query, 'i');

        const [startups, incubators] = await Promise.all([
            Startup.find({ name: searchRegex }).select('name logo_url'),
            Incubator.find({ name: searchRegex }).select('name logo_url')
        ]);

        res.json({ 
            results: [
                ...startups.map(s => ({ ...s._doc, role: 'startup' })),
                ...incubators.map(i => ({ ...i._doc, role: 'incubator' }))
            ] 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const myId = req.profileId; 
        const { logo, name, tagline, website_url, location, detailed_description } = req.body;

        const updateFields = {};
        
        // 1. Handle Image Upload to Cloudinary
        if (logo && logo.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploader.upload(logo, { folder: 'logos' });
            updateFields.logo_url = uploadRes.secure_url;
        }

        // 2. Map Top Level Fields only if they exist in the request
        if (name) updateFields.name = name;
        if (tagline) updateFields.tagline = tagline;
        if (website_url) updateFields.website_url = website_url;
        if (detailed_description) updateFields.detailed_description = detailed_description;

        // 3. Map Nested Location Fields using Dot Notation (The Fix)
        if (location) {
            if (location.city) updateFields['location.city'] = location.city;
            if (location.state) updateFields['location.state'] = location.state;
            if (location.country) updateFields['location.country'] = location.country;
        }

        let profile;
        // Use the role attached by your authMiddleware
        const Model = req.role === 'startup' ? Startup : Incubator;

        profile = await Model.findByIdAndUpdate(
            myId, 
            { $set: updateFields }, 
            { new: true, runValidators: true }
        );

        if (!profile) return res.status(404).json({ message: "Profile update target not found" });

        res.json({ success: true, profile });
    } catch (err) {
        console.error("Update Controller Error:", err);
        res.status(500).json({ error: err.message });
    }
};