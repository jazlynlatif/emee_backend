import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

console.log('server is here');

console.log('DB_CA_CERT exists:', !!process.env.DB_CA_CERT);
console.log(
  'DB_CA_CERT valid:',
  process.env.DB_CA_CERT?.includes('BEGIN CERTIFICATE')
);


export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
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
