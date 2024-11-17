import pkg from 'pg';
const { Client } = pkg;

export const connectDB = async (config) => {
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Database connected successfully');
        return client;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1); // Exit the process with a failure status
    }
};
