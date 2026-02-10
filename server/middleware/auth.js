import jwt from 'jsonwebtoken';
import User from '../model/UserModel.js';

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');

    if (!token) return res.status(401).json({ message: 'No token, auth denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.startupId = decoded.id; // User ID

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // CRITICAL: Attach both profileId and role for the update logic
        req.profileId = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
        req.role = user.role; 
        
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(401).json({ message: 'Token invalid' });
    }
};

export default authMiddleware;