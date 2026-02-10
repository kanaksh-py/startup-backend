import { Queue } from 'bullmq';

const deactivationQueue = new Queue('Startup-expiry', {
    connection: {
        host: '127.0.0.1',
        port: 6379
    }
});

export default deactivationQueue;
