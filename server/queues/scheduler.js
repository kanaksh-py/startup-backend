import deactivationQueue from './deactivationQueue.js';

const scheduleInactivityCheck = async () => {
    try {
        await deactivationQueue.add(
        'daily-check',
        {},
        {
            jobId: 'deactivation-cron',
            repeat: {
            pattern: '0 0 * * *', // every day at midnight
            },
            removeOnComplete: true
        }
        );

        console.log('Deactivation scheduler initialized');
    } catch (err) {
        console.error('Failed to schedule deactivation:', err);
    }
};

export default scheduleInactivityCheck;
