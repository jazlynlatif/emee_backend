import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (subject, sessionId) =>
  jwt.sign(
    { sub: subject.id, type: subject.type, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

export const generateRefreshToken = () =>
  crypto.randomBytes(64).toString('hex');

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
