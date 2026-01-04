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

router.use(express.json());

router.get('/admin/:admin/report/get/assigned', verifyAccessToken, async (req, res) => {
  const { admin } = req.params;
  try{
    const [result] = await pool.query(
      'SELECT reports.*, users_info.first_name AS name, units.unit_code AS unitcode FROM reports  JOIN users_info ON users_info.user_id = reports.user_id JOIN units ON units.units_id = reports.assigned_unit_id WHERE reports.service_id = ? AND assigned_unit_id IS NOT NULL AND reports.ended_at IS NULL ORDER BY reports.created_at DESC',
      [admin]
    )

    if(result.length == 0) {
      return res.status(200).send('No report found :)');
    }

    const id = result[0]['assesment_id']

    const [assesment] = await pool.query(
      'SELECT deskripsi FROM assesment WHERE service_id = ? AND id = ?',
      [admin, id]
    )

    const set = {
      report_data : result,
      assesment_data : assesment
    }

    return res.status(200).send(set);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/:admin/report/get/unassigned', verifyAccessToken, async (req, res) => {
  const { admin } = req.params;
  try{
    const [result] = await pool.query(
      'SELECT reports.*, users_info.first_name AS name FROM reports  JOIN users_info ON users_info.user_id = reports.user_id WHERE reports.service_id = ? AND assigned_unit_id IS NULL AND reports.ended_at IS NULL ORDER BY reports.created_at DESC',
      [admin]
    )

    const id = result[0]['assesment_id']

    const [assesment] = await pool.query(
      'SELECT deskripsi FROM assesment WHERE service_id = ? AND id = ?',
      [admin, id]
    )

    const set = {
      report_data : result,
      assesment_data : assesment
    }

    return res.status(200).send(set);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/:service/history/report/get/:start/:end', verifyAccessToken, async (req, res) => {
  const { service, start, end } = req.params;
  try {
    const [result] = await pool.query(
      'SELECT reports.*, asses.deskripsi, users_info.first_name FROM reports JOIN assesment asses ON asses.id = reports.assesment_id JOIN users_info ON users_info.user_id = reports.user_id WHERE reports.service_id = ? AND reports.ended_at IS NOT NULL AND (reports.created_at >= ? AND reports.created_at < DATE_ADD(?, INTERVAL 1 DAY)) ORDER BY reports.created_at DESC;',
      [service, start, end]
    )

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/unit/:service/:unitid/history/report/get/:start/:end', verifyAccessToken, async (req, res) => {
  const { service, unitid, start, end } = req.params;
  try {
    const [result] = await pool.query(
      'SELECT reports.*, asses.deskripsi, users_info.first_name FROM reports JOIN assesment asses ON asses.id = reports.assesment_id JOIN users_info ON users_info.user_id = reports.user_id WHERE reports.service_id = ? AND reports.assigned_unit_id = ? AND reports.ended_at IS NOT NULL AND (reports.created_at >= ? AND reports.created_at < DATE_ADD(?, INTERVAL 1 DAY)) ORDER BY reports.created_at DESC;',
      [service, unitid, start, end]
    )
    console.log(service, unitid, start, end);
    console.log(result);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/report/get/:serviceid/:reportid/:status', verifyAccessToken, async (req,res) => {
  const { serviceid, reportid, status } = req.params;
  try {
    const [result] = await pool.query(
      "SELECT CONCAT(info.first_name,' ', info.last_name) AS username, info.birth_date AS birthdate, info.gender AS gender, asses.indicator1 AS victimId  FROM reports JOIN users_info info ON info.user_id = reports.user_id JOIN assesment asses ON asses.id = reports.assesment_id WHERE reports.report_id = ?",
      [reportid]
    )

    const victim = result[0]['victimId'];
    console.log(serviceid);
    let mednotes;
    let contacts;
    if(victim == 0 && status == 1 && serviceid == 1) {
      [mednotes] = await pool.query(
        "SELECT mednote.id AS mednoteId, mednote.title AS mednoteTitle, mednote.notes AS mednoteNotes FROM reports JOIN medical_notes mednote ON mednote.user_id = reports.user_id WHERE reports.report_id = ?;",
        [reportid]
      );

      [contacts] = await pool.query(
        "SELECT contact.id AS contactId, contact.contact_name AS contactName, contact.phone_number AS contactNum FROM reports JOIN emergency_contacts contact ON contact.user_id = reports.user_id WHERE reports.report_id = ?;",
        [reportid]
      );

      const set = {
        initial : result,
        mednote : mednotes,
        contact : contacts
      }
      return res.status(200).send(set);
    }

    return res.status(200).send(result);

  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/message/get/:report', verifyAccessToken,  async (req,res) => {
  const { report } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT * FROM messages WHERE report_id = ? ORDER BY created_at', 
      [report]
    );

    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.get('/history/message/get/:report', verifyAccessToken,  async (req,res) => {
  const { report } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT * FROM messages WHERE report_id = ? ORDER BY created_at', 
      [report]
    );

    console.log(result);

    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/assesment/get/:reportid', verifyAccessToken, async (req,res) => {
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

router.post('/admin/message/send', verifyAccessToken, async (req,res) => {
  const { message, report } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO messages (report_id, message_type, text_content, sender) VALUES (?, ?, ?, ?)',
      [report, 'text', message, 1]
    );

    return res.status(200).send(result);

  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.post('/admin/report/post/ended', verifyAccessToken, async (req, res) => {
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

export default router;