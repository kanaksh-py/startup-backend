import jwt from 'jsonwebtoken';
import User from '../model/UserModel.js';

// 1. STRICT AUTH (Keep this name so your other routes don't break)
const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');

    if (!token) return res.status(401).json({ message: 'No token, auth denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.startupId = decoded.id; 

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        req.profileId = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
        req.role = user.role; 
        
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(401).json({ message: 'Token invalid' });
    }
};

// 2. PUBLIC AUTH (New: Allows guests to view shared profiles)
export const publicAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');

    // If no token, just proceed as a guest (req.startupId will be undefined)
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
            req.startupId = decoded.id;
            req.profileId = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
            req.role = user.role; 
        }
        next();
    } catch (err) {
        next(); // Proceed as guest even if token is invalid
    }
};

export default authMiddleware;