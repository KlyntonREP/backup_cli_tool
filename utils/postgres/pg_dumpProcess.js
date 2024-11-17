import fs from 'fs';
import { spawn } from 'child_process';
import { createSpinner } from 'nanospinner';
import { connectDB } from './pg_connection.js';
import { confirm_continue } from '../../index.js';

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));



export const backup_postgresDB = async(host, username, password, DB_name, dest_folder, pgDump) => {
    const dbConfig = {
        user: username,
        password: password,
        host: host,
        database: DB_name,
    };
    try {
        // Initialize the database connection
        const dbClient = await connectDB(dbConfig);

        // Example query to test the connection
        const res = await dbClient.query('SELECT NOW()');
        const currentDate = new Date(res.rows[0].now).toISOString().split('T')[0];
        console.log('Current date:', currentDate);

        dumpDatabase(host, username, DB_name, password, dest_folder, pgDump)

    } catch (error) {
        console.error('Error starting server:', error.message);
        process.exit(1);
    }
}

const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-based, so we add 1
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const dumpDatabase = async (host, username, DB_name, password, dest_folder, pgDump) => {
    const date = getCurrentDate();
    const outputFile = `${dest_folder}_${date}.sql`
    const writeStream = fs.createWriteStream(outputFile);

    const dump = spawn(`${pgDump}`, [
        '-U', username,           // Username
        '-h', host,           // Host
        '-d', DB_name,       // Database name
        '-F', 'p',          // Output format
        '-f', outputFile 
    ], {
        stdio: ['pipe', 'pipe', 'pipe'], // Ensure `stdout` and `stderr` are available
        env: {
            ...process.env,            // Include the current environment variables
            PGPASSWORD: password // Set the password securely
        }
    });
    const spinner = createSpinner(`Backing Up Your Database Tables To ${dest_folder}. Please Wait ....`).start();
    await sleep();
    // Pipe the pg_dump output to the writable file stream
    dump.stdout
        .pipe(writeStream)
        .on('finish', () => {
            spinner.success({ text: `Database backed up successfully!✅✅✅` });
            confirm_continue();
        })
        .on('error', (err) => {
            spinner.error({ text: `Error during file write` });
            process.exit(1);
        });
    
    // Error handling for the dump process
    dump.on('error', (err) => {
        spinner.error(`Failed to start pg_dump process: ${err}`);
        process.exit(1);
    });
    
    // Capture any errors from the pg_dump process
    dump.stderr.on('data', (data) => {
        spinner.error(`pg_dump error: ${data.toString()}`);
        process.exit(1);
    });
};
