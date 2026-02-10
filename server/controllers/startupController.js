import Startup from '../model/StartupModel.js';

const getStartupStatus = async (req, res) => {
    try {
        const startup = await Startup.findById(req.startupId);
        if (!startup) return res.status(404).json({ message: "Startup not found" });

        const now = new Date();
        const lastPost = new Date(startup.lastPostDate);
        
        // Constants in Milliseconds
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        // 1. Calculate Next Post Availability
        const nextPostAt = new Date(lastPost.getTime() + ONE_WEEK);
        const msUntilNextPost = nextPostAt - now;
        const canPostNow = msUntilNextPost <= 0;

        // 2. Calculate Deactivation Countdown
        const deactivationAt = new Date(lastPost.getTime() + THIRTY_DAYS);
        const msUntilDeactivation = deactivationAt - now;

        res.status(200).json({
            success: true,
            status: startup.status,
            lastPostDate: startup.lastPostDate,
            posting: {
                canPostNow,
                nextPostAt,
                daysRemaining: canPostNow ? 0 : Math.ceil(msUntilNextPost / (1000 * 60 * 60 * 24))
            },
            deactivation: {
                deactivationAt,
                daysUntilDeactivation: Math.max(0, Math.ceil(msUntilDeactivation / (1000 * 60 * 60 * 24)))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export default getStartupStatus;