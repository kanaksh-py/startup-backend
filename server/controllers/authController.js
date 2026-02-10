import User from '../model/UserModel.js';
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';
import cloudinary from '../config/cloudinary.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { email, password, role, name, logo, ...profileData } = req.body;

        // 1. Verify User doesn't exist
        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        // 2. Upload Logo to Cloudinary
        let logoUrl = '';
        if (logo) {
            const uploadRes = await cloudinary.uploader.upload(logo, { folder: 'logos' });
            logoUrl = uploadRes.secure_url;
        }

        // 3. Create and Hash User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role });

        let profile;
        if (role === 'startup') {
            // MAP FLAT DATA INTO NESTED SCHEMA OBJECTS
            profile = new Startup({
                user: user._id,
                name: name,
                logo_url: logoUrl,
                tagline: profileData.tagline,
                website_url: profileData.website_url,
                status: profileData.status || 'idea',
                // Nesting the location data
                location: {
                    city: profileData.city,
                    state: profileData.state,
                    country: profileData.country
                },
                // Nesting the industry data
                industry: {
                    primary: profileData.primary_industry,
                    problem_statement: profileData.problem_statement
                },
                // Nesting the lookingFor data
                lookingFor: {
                    seeking_incubation: profileData.seeking_incubation === true || profileData.seeking_incubation === 'true',
                    seeking_funding: profileData.seeking_funding === true || profileData.seeking_funding === 'true'
                }
            });
            await profile.save();
            user.startupProfile = profile._id;
        } else {
            // Incubator mapping (Keep it flat or nested as per your Incubator model)
            profile = new Incubator({
                user: user._id,
                name,
                logo_url: logoUrl,
                ...profileData 
            });
            await profile.save();
            user.incubatorProfile = profile._id;
        }

        await user.save();

        // 4. Generate Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            token,
            user: { 
                id: user._id, 
                role: user.role, 
                profileId: profile._id,
                name: profile.name, 
                logo: profile.logo_url 
            }
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// ... keep your login and getStatus functions here
// authController.js - UPDATED LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password').populate('startupProfile incubatorProfile');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            token,
            user: {
                id: user._id,
                role: user.role,
                profileId: profile._id, // THIS KEY IS CRITICAL
                name: profile.name,
                logo: profile.logo_url
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// authController.js - UPDATED REGISTER
// server/controllers/authController.js

// ... keep login and getStatus as they are

export const getStatus = async (req, res) => {
    try {
        const user = await User.findById(req.startupId)
            .populate('startupProfile incubatorProfile');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;

        // --- DYNAMIC 7-DAY WARNING / 30-DAY DEACTIVATION LOGIC ---
        let daysLeft = 0;
        if (user.role === 'startup' && profile) {
            const now = new Date();
            // Use lastPostDate or fallback to createdAt if they haven't posted yet
            const lastActivity = profile.lastPostDate || profile.createdAt;
            
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const deactivationDate = new Date(lastActivity.getTime() + THIRTY_DAYS_MS);
            
            const msRemaining = deactivationDate - now;
            // Convert to days and round up
            daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
        }

        res.json({
            role: user.role,
            profileId: profile?._id,
            name: profile?.name,
            logo: profile?.logo_url,
            deactivation: {
                // If they have more than 7 days, you can still show the count 
                // or logic to trigger the red warning in your UI
                daysUntilDeactivation: daysLeft 
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};