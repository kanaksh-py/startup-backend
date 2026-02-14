import User from '../model/UserModel.js';
import Startup from '../model/StartupModel.js';
import Incubator from '../model/IncubatorModel.js';
import cloudinary from '../config/cloudinary.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { email, password, role, name, logo, ...profileData } = req.body;

        // 1. Unique Checks
        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        const [existingStartup, existingIncubator] = await Promise.all([
            Startup.findOne({ name }),
            Incubator.findOne({ name })
        ]);
        if (existingStartup || existingIncubator) {
            return res.status(400).json({ message: "Entity name already taken." });
        }

        // 2. Logo Upload
        let logoUrl = '';
        if (logo) {
            try {
                const uploadRes = await cloudinary.uploader.upload(logo, { folder: 'logos' });
                logoUrl = uploadRes.secure_url;
            } catch (cloudErr) {
                console.error("Cloudinary Upload Failed:", cloudErr);
            }
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
                location: {
                    address_line: profileData.location?.address_line,
                    city: profileData.location?.city,
                    state: profileData.location?.state,
                    pincode: profileData.location?.pincode,
                    country: profileData.location?.country || 'India',
                },
                industry: profileData.industry,
                product: profileData.product,
                funding: profileData.funding,
                team: profileData.team,
                socials: profileData.socials
            });
        } else {
            // FIX: Explicit mapping for Incubator to avoid Enum/Validation errors
            profile = new Incubator({
                user: user._id,
                name,
                logo_url: logoUrl,
                description: req.body.description || "",
                website_url: profileData.website_url || "",
                organization_type: profileData.organization_type || 'incubator',
                location: { 
                    address_line: profileData.location?.address_line || "",
                    city: profileData.location?.city || "", 
                    state: profileData.location?.state || "",
                    pincode: profileData.location?.pincode || "",
                    country: profileData.location?.country || 'India',
                    coverage_area: profileData.coverage_area || 'local' 
                },
                programDetails: { 
                    program_name: profileData.programDetails?.program_name || name,
                    equity_taken_percentage: Number(profileData.programDetails?.equity_taken_percentage) || 0,
                    program_format: profileData.programDetails?.program_format || 'hybrid'
                },
                trackRecord: {
                    number_of_startups_supported: Number(profileData.trackRecord?.number_of_startups_supported) || 0
                },
                socials: {
                    contact_email: profileData.contact_email || email,
                    contact_phone: profileData.contact_phone || ""
                }
            });
        }

        // 3. Sequential Save
        await profile.save();

        if (role === 'startup') user.startupProfile = profile._id;
        else user.incubatorProfile = profile._id;
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        return res.status(201).json({
            token,
            user: { 
                id: user._id, 
                role: user.role, 
                profileSlug: profile.slug, 
                profileId: profile._id, 
                name: profile.name, 
                logo: profile.logo_url 
            }
        });
    } catch (err) {
        console.error("FATAL REGISTRATION ERROR:", err); // Check terminal for this
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate record detected." });
        return res.status(500).json({ message: "Sync Protocol Failure", error: err.message });
    }
};

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
                profileSlug: profile.slug, 
                profileId: profile._id,   
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
        const user = await User.findById(req.userId || req.startupId).populate('startupProfile incubatorProfile');
        if (!user) return res.status(404).json({ message: "User not found" });
        const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
        return res.json({ role: user.role, profileId: profile._id, profileSlug: profile.slug, name: profile.name, status: profile.operating_status });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};