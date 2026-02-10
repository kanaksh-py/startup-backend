import { Worker } from 'bullmq';
import Startup from '../model/StartupModel.js';

const worker = new Worker('startup-expiry', async (job) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const twentyOneDaysAgo = new Date(now.getTime() - (21 * 24 * 60 * 60 * 1000));

    try {
        // 1. Deactivate those past 30 days
        const deactivated = await Startup.updateMany(
            { 
                lastPostDate: { $lt: thirtyDaysAgo },
                status: 'active' 
            },
            { $set: { status: 'inactive' } }
        );

        // 2. Find those past 21 days for a "Warning"
        const needingWarning = await Startup.find({
            lastPostDate: { $lt: twentyOneDaysAgo, $gt: thirtyDaysAgo },
            status: 'active'
        });

        console.log(`Log: ${deactivated.modifiedCount} startups deactivated.`);
        if (needingWarning.length > 0) {
            console.log(`Alert: ${needingWarning.length} startups need a warning email.`);
            // email service
        }

    } catch (error) {
        console.error('Worker Error:', error);
    }
}, {
    connection: { host: '127.0.0.1', port: 6379 }
});

export default worker;