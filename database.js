import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const formatCert = (rawCert) => {
  if (!rawCert) return '';
  
  // Remove any existing quotes, spaces, or weird formatting
  const cleanCert = rawCert.replace(/["']/g, '').trim();

  // If it already has newlines, just return it
  if (cleanCert.includes('\n')) return cleanCert;

  // Otherwise, take the "core" of the cert and wrap it with newlines every 64 chars
  // This is the standard PEM format requirement
  const header = "-----BEGIN CERTIFICATE-----";
  const footer = "-----END CERTIFICATE-----";
  
  let body = cleanCert
    .replace(header, '')
    .replace(footer, '')
    .replace(/\s/g, ''); // Remove all spaces

  // Rebuild the body with a newline every 64 characters
  const regex = /.{1,64}/g;
  const lines = body.match(regex) || [];
  
  return `${header}\n${lines.join('\n')}\n${footer}`;
};

const finalCert = formatCert(process.env.DB_CA_CERT);

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
