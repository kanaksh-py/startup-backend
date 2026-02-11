import User from '../model/UserModel.js';
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';
import cloudinary from '../config/cloudinary.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// server/controllers/authController.js

// ... (keep imports)

export const register = async (req, res) => {
    try {
        const { email, password, role, name, logo, ...profileData } = req.body;

        // 1. PRE-CHECK: Ensure Email is unique
        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        // 2. PRE-CHECK: Ensure Name is unique across both collections to prevent duplicate search hits
        const [existingStartup, existingIncubator] = await Promise.all([
            Startup.findOne({ name }),
            Incubator.findOne({ name })
        ]);
        if (existingStartup || existingIncubator) {
            return res.status(400).json({ message: "Entity name already taken." });
        }

        let logoUrl = '';
        if (logo) {
            const uploadRes = await cloudinary.uploader.upload(logo, { folder: 'logos' });
            logoUrl = uploadRes.secure_url;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role });

        let profile;
        if (role === 'startup') {
            profile = new Startup({
                user: user._id,
                name,
                logo_url: logoUrl,
                tagline: profileData.tagline,
                detailed_description: profileData.detailed_description,
                website_url: profileData.website_url,
                founded_year: profileData.founded_year,
                legal_entity_name: profileData.legal_entity_name,
                company_registration_number: profileData.company_registration_number,
                status: profileData.status || 'idea',
                location: {
                    city: profileData.city,
                    state: profileData.state,
                    country: profileData.country,
                    remote_friendly: profileData.remote_friendly === true
                },
                industry: {
                    primary: profileData.primary_industry,
                    niche: profileData.niche,
                    problem_statement: profileData.problem_statement,
                    target_market: profileData.target_market || 'B2B',
                    customer_segment: profileData.customer_segment
                },
                product: {
                    stage: profileData.product_stage,
                    business_model: profileData.business_model,
                    revenue_model: profileData.revenue_model,
                    ip_status: profileData.ip_status
                },
                funding: {
                    stage: profileData.funding_stage,
                    total_amount: profileData.total_funding_amount,
                    key_investors: profileData.key_investors
                },
                team: { size: profileData.team_size, hiring: profileData.hiring === true },
                needs: {
                    seeking_incubation: profileData.seeking_incubation === true,
                    seeking_funding: profileData.seeking_funding === true,
                    seeking_partners: profileData.seeking_partners === true,
                    seeking_mentors: profileData.seeking_mentors === true
                },
                socials: { 
                    linkedin_url: profileData.linkedin_url,
                    twitter_url: profileData.twitter_url,
                    pitch_deck_url: profileData.pitch_deck_url
                }
            });
        } else {
            profile = new Incubator({
                user: user._id,
                name,
                logo_url: logoUrl,
                description: profileData.detailed_description,
                website_url: profileData.website_url,
                contact_email: profileData.contact_email,
                contact_phone: profileData.contact_phone,
                location: { city: profileData.city, country: profileData.country },
                programDetails: { 
                    program_name: profileData.program_name,
                    equity_taken_percentage: profileData.equity_taken_percentage,
                    program_format: profileData.program_format
                }
            });
        }

        // Save Profile First
        await profile.save();

        // Link Profile to User and Save User
        if (role === 'startup') user.startupProfile = profile._id;
        else user.incubatorProfile = profile._id;
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
            token,
            user: { id: user._id, role: user.role, profileId: profile.slug, name: profile.name, logo: profile.logo_url }
        });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate record detected." });
        return res.status(500).json({ error: err.message });
    }
};

// server/controllers/authController.js

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password').populate('startupProfile incubatorProfile');
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.json({
            token,
            user: { 
                id: user._id, 
                role: user.role, 
                profileSlug: profile.slug, // For URL/Navigation
                profileId: profile._id,   // FOR CHAT LOGIC (ObjectID)
                name: profile.name, 
                logo: profile.logo_url 
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const getStatus = async (req, res) => {
    try {
        const user = await User.findById(req.startupId).populate('startupProfile incubatorProfile');
        if (!user) return res.status(404).json({ message: "User not found" });
        const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
        return res.json({ role: user.role, profileId: profile.slug, name: profile.name, status: profile.operating_status });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};