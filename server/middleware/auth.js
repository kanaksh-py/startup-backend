import jwt from 'jsonwebtoken';
import User from '../model/UserModel.js';

/**
 * 1. STRICT AUTH MIDDLEWARE
 * Use this for routes that REQUIRE a login (Chat, Updating Profile, Posting)
 */
const authMiddleware = async (req, res, next) => {
    // Safety check for middleware configuration
    if (typeof next !== 'function') {
        return res.status(500).json({ error: "Middleware Chain Broken: 'next' is not a function" });
    }

    // Get token from Header
    const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: 'Authorization Required: No token found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach IDs to request object
        req.userId = decoded.id; 
        req.startupId = decoded.id; // Kept for compatibility with your existing controllers

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "Identity sync failed: User not found" });
        }

        // Attach Profile ID and Role
        req.profileId = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
        req.role = user.role; 

        next(); // Request is authorized, proceed to controller
    } catch (err) {
        console.error("Strict Auth Failure:", err.message);
        return res.status(401).json({ message: 'Identity Token Invalid or Expired' });
    }
};

/**
 * 2. PUBLIC AUTH MIDDLEWARE
 * Use this for routes that are public but should show "User Data" if logged in (Public Profiles, Feed)
 */
export const publicAuth = async (req, res, next) => {
    if (typeof next !== 'function') return res.status(500).json({ error: "Next missing" });

    const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');
    
    // If no token, just continue as a guest
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user) {
            req.userId = decoded.id;
            req.startupId = decoded.id;
            req.profileId = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
            req.role = user.role; 
        }
        next();
    } catch (err) {
        // On public routes, even if token is invalid, we just treat them as guest
        next(); 
    }
};

export default authMiddleware;