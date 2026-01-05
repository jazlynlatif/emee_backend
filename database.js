import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

console.log('server is here');

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  
  // Aiven requires SSL. This tells mysql2 to use the certificate
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT.replace(/\\n/g, '\n'),
  },
  
  // Best practice for pools
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise()

// export const pool = mysql.createPool({
//   host : process.env.DB_HOST,
//   user : process.env.DB_USER,
//   password : process.env.DB_PASSWORD,
//   database : process.env.DB_DATABASE
// }).promise()
