import {pool} from '../../database.js';
import express, { json } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../../middleware/auth.js';

const router = express.Router();

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

  

//   if(token == null) {
//     return res.status(401);
//   }


//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if(err) {
//       return res.status(403).send(err);
//     }

//     req.user = user;
//     next();
//   })
// }

router.get('/messagestatus/get/:report', verifyAccessToken,  async (req,res) => {
  const { report } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT * FROM messages WHERE report_id = ? ORDER BY created_at', 
      [report]
    );
    
    const [progress] = await pool.query(
      'SELECT progress, ended_at FROM reports WHERE report_id = ?',
      [report]
    )

    const set = {
      message : result,
      progress : progress[0]['progress'],
      endedat : progress[0]['ended_at']
    }

    return res.status(200).send(set);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.get('/report/get/:report', verifyAccessToken, async (req,res) => {
  const { report } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT * FROM reports WHERE report_id = ?',
      [report]
    )

    // switch(service) {
    //   case 1 :
    //     result = await pool.query(
    //       'SELECT * FROM medic_reports WHERE user_id = ? AND report = ?',
    //       [req.user.id, report]
    //     )
    //     break;

    //   case 2 :
    //     result = await pool.query(
    //       'SELECT * FROM firedept_reports WHERE user_id = ? AND report = ?',
    //       [req.user.id, report]
    //     )
    //     break;
    // }
    
    return res.status(200).send(result);

  } catch(err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/user/assesment/get/:serviceid/:indicator1/:indicator2', verifyAccessToken, async (req, res) => {
  const { serviceid, indicator1, indicator2 } = req.params;

  try {
    const [questions] = await pool.query(
      'SELECT q.question_text, assesment.id FROM assesment JOIN assesment_questions q ON q.assesment_id = assesment.id WHERE assesment.service_id = ? AND assesment.indicator1 = ? AND assesment.indicator2 = ?',
      [serviceid, indicator1, indicator2]
    )

    const assesmentid = questions[0]['id'];

    const [answers] = await pool.query(
      'SELECT a.question_id, a.id, a.answer_text FROM assesment_questions JOIN assesment_answers a ON a.question_id = assesment_questions.id WHERE assesment_questions.assesment_id = ?',
      [assesmentid]
    )

    console.log(answers);

    const set = {
      question_list : questions,
      answer_list : answers,
      assesment_id : assesmentid
    }

    return res.status(200).send(set);
    
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/user/assesment/get/:reportid', verifyAccessToken, async (req,res) => {
  const { reportid } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT DISTINCT assq.question_text AS question, COALESCE(assa.answer_text, "Tidak terjawab") AS answer FROM user_answers ans JOIN assesment_questions assq ON assq.id = ans.question_id LEFT JOIN assesment_answers assa ON assa.id = ans.answer_id JOIN reports ON reports.report_id = ans.report_id JOIN users ON users.user_id = reports.user_id WHERE ans.report_id = ?;', 
      [reportid]
    );

    return res.status(200).send(result);
  } catch(err) {
    return res.status(500).send(err.toString());
  }
})

router.post('/assesment/answer', verifyAccessToken, async (req,res) => {
  const { reportid, assesmentid, userAnswer, questionId } = req.body;
  
  try {
    console.log('trigerred');
    for(let i = 0 ; i <+ userAnswer.length ; i ++) {
      const [result] = await pool.query(
        'INSERT INTO user_answers (report_id, assesment_id, question_id, answer_id) VALUES (?, ?, ?, ?)',
        [reportid, assesmentid, questionId[i], userAnswer[i]]
      );
    }

    return res.status(201).send('success :)');
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.post('/report/post', verifyAccessToken,  async (req, res) => {
  const { service, indicator1, indicator2, latitude, longitude } = req.body;
  try {
    const [assesment] = await pool.query(
      'SELECT id FROM assesment WHERE service_id = ? AND indicator1 = ? AND indicator2 = ?',
      [service, indicator1, indicator2]
    )
    console.log(service, indicator1, indicator2);
    const assesment_id = assesment[0]['id'];

    console.log(assesment);

    const [result] = await pool.query(
      'INSERT INTO reports (user_id, service_id, assesment_id, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [req.auth.id, service, assesment_id, latitude, longitude]
    );

    console.log('here here');

    return res.status(200).send(result);

  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.post('/report/post/ended', verifyAccessToken, async (req, res) => {
  const { report_id, ended_at } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE reports SET ended_at = ? WHERE report_id = ?',
      [ended_at, report_id]
    );

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.post('/message/send', verifyAccessToken, async (req,res) => {
  const { message, report } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO messages (report_id, message_type, text_content, sender) VALUES (?, ?, ?, ?)',
      [report, 'text', message, 0]
    );

    return res.status(200).send(result);

  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})



export default router;