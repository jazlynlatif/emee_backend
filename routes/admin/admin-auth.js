import {pool} from '../../database.js';
import express, { json } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken
} from '../../token.js';
import { verifyAccessToken } from '../../middleware/auth.js';

const router = express.Router();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  

  if(token == null) {
    return res.status(401);
  }


  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if(err) {
      return res.status(403).send(err);
    }

    req.user = user;
    next();
  })
}

router.use(express.json());

router.post('/login/admin', async (req, res) => {
  const { id, password, role } = req.body;

  try {
    let rows;
    let unitsid;

    switch(role) {
      case 'dispatch':
        [rows] = await pool.query('SELECT * FROM admin WHERE adminID = ?', [id]);
        break;

      case 'unit':
        [rows] = await pool.query('SELECT * FROM units WHERE unit_code = ?', [id]);
        unitsid = rows[0]['units_id'];
        break;
    }

    if (rows.length === 0) {
      return res.status(401).send('ID is not valid');
    }

    const user = rows[0];
    const serviceid = user['service_id'];

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
      return res.status(401).send('Your ID and/or password is incorrect');
    }
    
    const refreshToken = generateRefreshToken();

    let userid = role == 'dispatch' ? user.id : user.units_id;
    
    const [sessionResult] = await pool.query(
      `INSERT INTO sessions
        (subject_id, subject_type, refresh_token_hash, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [userid, role, hashToken(refreshToken)]
    );

    const accessToken = generateAccessToken(
      { id: user.id, type: role },
      sessionResult.insertId
    );

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      unitsid,
      serviceid
    });
    
  }
  catch (err) {
    return res.status(500).send(err.toString());
  }
});

export default router;