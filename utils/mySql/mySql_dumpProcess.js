
import { exec } from 'child_process';
import { createSpinner } from 'nanospinner';
import fs from 'fs/promises';
import { confirm_continue } from '../../index.js';
import { connectDB } from './mySql_connection.js';

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));


export const backup_mysqlDB = async (host, username, password, DB_name, dest_folder, mySqlDump) => {
    const dbConfig = {
        host: host,
        user: username,
        password: password,
        database: DB_name,
    };

    try {
        // Initialize the MySQL database connection
        const dbClient = await connectDB(dbConfig);

        // Example query to test the connection
        const [rows] = await dbClient.execute('SELECT NOW() AS now');
        const currentDate = new Date(rows[0].now).toISOString().split('T')[0];
        console.log('Current date:', currentDate);

        // Proceed to dump the database
        await dumpDatabase(host, username, DB_name, password, dest_folder, mySqlDump);
        await dbClient.end();
    } catch (error) {
        console.error('Error during MySQL backup:', error.message);
        process.exit(1);
    }
};

const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-based, so we add 1
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const dumpDatabase = async (host, username, DB_name, password, dest_file, mySqlDump) => {
    const date = getCurrentDate();
    const dest_file_with_date = `${dest_file}_${date}.sql`;
    const spinner = createSpinner(`Backing Up MySQL Database To ${dest_file}. Please Wait ....`).start();
    await sleep();

    // Command to run mysqldump
    const command = `${mySqlDump} -u ${username} -h 0.0.0.0 --password=${password} ${DB_name} > ${dest_file_with_date}`;

    try {
        // Check if the file exists, and delete it if it does
        try {
            await fs.access(dest_file_with_date);
            await fs.unlink(dest_file_with_date);
            console.log(`Previous backup file ${dest_file_with_date} deleted.`);
        } catch (error) {
            // File doesn't exist, so we continue without error
        }

        // Execute the mysqldump command
        exec(command, (error, stdout, stderr) => {
            // Handle actual errors
            if (error) {
                spinner.error({ text: `Exec error: ${error.message}` });
                process.exit(1);
            }

            // Ignore specific warning about password usage
            if (stderr.includes("Using a password on the command line interface can be insecure.")) {
                stderr = ""; // Clear the warning message so it does not interfere
            }

            // Check for any remaining stderr messages
            if (stderr.trim()) {
                spinner.error({ text: `mysqldump error: ${stderr}` });
                process.exit(1);
            }

            spinner.success({ text: `MySQL database backed up successfully!✅✅✅` });
            confirm_continue();
            
        });
    } catch (err) {
        spinner.error({ text: `Failed during file operation: ${err.message}` });
        process.exit(1);
    }
};