import mysql from 'mysql2/promise';

export const connectDB = async (dbConfig) => {
  try {
      const connection = await mysql.createConnection({
          ...dbConfig,
          connectTimeout: 10000,
          enableKeepAlive: true,  // Keep the connection alive
        });
      connection.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.error('Database connection was closed.');
        } else if (err.code === 'ER_CON_COUNT_ERROR') {
          console.error('Database has too many connections.');
        } else if (err.code === 'ECONNREFUSED') {
          console.error('Database connection was refused.');
        }
      });
      console.log('Connected to MySQL database.');
      return connection;
  } catch (error) {
      console.log("Config ===========", dbConfig);
      console.error('Error connecting to the MySQL database:', error.message);
      throw error;
  }
};

// 209.97.188.201 capittrut_ccb {Et4.WZ?oUP5 capittrut_capitalCityTrusts 
//   capital_city_backup