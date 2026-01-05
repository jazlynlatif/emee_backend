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

const rawCert = process.env.DB_CA_CERT || '';
// This regex helps catch if the string is just one long line or has real breaks
const hasRealNewlines = rawCert.includes('\n');
const hasEscapedNewlines = rawCert.includes('\\n');

console.log('Cert has real newlines:', hasRealNewlines);
console.log('Cert has escaped \\n:', hasEscapedNewlines);

const finalCert = rawCert.replace(/\\n/g, '\n').trim();


export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Aiven requires SSL. This tells mysql2 to use the certificate
  ssl: {
    ca: finalCert,
    rejectUnauthorized: true,
    // ADD THIS LINE - It is often the "missing link" for Aiven
    servername: process.env.DB_HOST
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
