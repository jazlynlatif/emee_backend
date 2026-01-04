import {pool} from '../../database.js';
import express from 'express';
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

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('you reached here! : about to pool')
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?;', [email]
    );

    console.log('you reached here! : after pool ')

    if (rows.length > 0 ) {
      console.log('Already exists');
      return res.status(400).send('Email already registered');
    };

    console.log('you reached here! : after exist check')

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('you reached here! : after hash')
    
    const [result] = await pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);

    console.log('you reached here!')

    const token = jwt.sign(
      {"id" : result.insertId},
      process.env.JWT_SECRET,
      {expiresIn : "1h"}
    )

    console.log('you reached here! : after jwt.sign')

    return res.status(201).json({
      message : 'Account registered succesfully', 
      token : token
    })

  } catch(err) {
    return res.status(500).send(err.toString());
  };
});

router.post('/register/complete', verifyAccessToken, async (req, res) => {
  const { first_name, last_name, gender, birth_date, phone_number } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users_info WHERE user_id = ?', [req.auth.id]
    );

    if(rows.length > 0) {
      return res.status(400).send('Information has been registered');
    }

    const date = new Date(birth_date);

    await pool.query(
      'INSERT INTO users_info (user_id, first_name, last_name, gender, birth_date, phone_number) VALUES (?, ?, ?, ?, ?, ?)', 
      [req.auth.id, first_name, last_name, gender, date, phone_number] 
    )

    return res.status(201).send('Information registered succesfully');

  } catch (err) {
    return res.status(500).send(err.toString());
  }

})

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).send('Email is not registered');
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
      return res.status(401).send('Your email and/or password is incorrect');
    }

    const refreshToken = generateRefreshToken();

    const [sessionResult] = await pool.query(
      `INSERT INTO sessions
       (subject_id, subject_type, refresh_token_hash, expires_at)
       VALUES (?, 'user', ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [user.user_id, hashToken(refreshToken)]
    );

    const accessToken = generateAccessToken(
      { id: user.user_id, type: 'user' },
      sessionResult.insertId
    );

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken
    });
    
  }
  catch (err) {
    return res.status(500).send(err.toString());
  }
});

router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    const [rows] = await pool.query(
      `SELECT id, subject_id, subject_type
       FROM sessions
       WHERE refresh_token_hash = ?
         AND revoked = FALSE
         AND expires_at > NOW()`,
      [hashToken(refreshToken)]
    );

    if (!rows.length) return res.sendStatus(401);

    const newRefresh = generateRefreshToken();

    await pool.query(
      `UPDATE sessions SET refresh_token_hash = ? WHERE id = ?`,
      [hashToken(newRefresh), rows[0].id]
    );

    res.json({
      accessToken: generateAccessToken(
        { id: rows[0].subject_id, type: rows[0].subject_type },
        rows[0].id
      ),
      refreshToken: newRefresh
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


router.post('/logout', verifyAccessToken, async (req, res) => {

  try {
    await pool.query(
      `UPDATE sessions SET revoked = TRUE WHERE id = ?`,
      [req.auth.sessionId]
    );

    res.sendStatus(204);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
  
});


export default router;