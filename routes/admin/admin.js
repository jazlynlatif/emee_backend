import {pool} from '../../database.js';
import express, { json } from 'express';
import bcrypt from 'bcrypt';
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

router.get('/admin/units/get/company', verifyAccessToken, async (req,res) => {
  try {
    const [result] = await pool.query(
      'SELECT * FROM company'
    )

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/dispatch/units/get/all/:serviceid', verifyAccessToken, async (req,res) => {
  const { serviceid } = req.params;
  try {
    const [result] = await pool.query(
      'SELECT units.units_id AS unitid, units.unit_code AS unitcode, units.plat_number AS licensenum, company.company_name AS companyname, units.vehicle_type AS vehicle, info.status AS unitstatus FROM units JOIN company ON company.company_id = units.company_id JOIN units_info info ON info.units_id = units.units_id WHERE service_id = ?',
      [serviceid]
    )
    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/dispatch/units/get/active/:serviceid', verifyAccessToken, async (req,res) => {
  const { serviceid } = req.params;
  try {
    const [result] = await pool.query(
      'SELECT units.units_id AS unitid, units.unit_code AS unitcode, units.plat_number AS licensenum, company.company_name AS companyname, units.vehicle_type AS vehicle, info.status AS unitstatus FROM units JOIN company ON company.company_id = units.company_id JOIN units_info info ON info.units_id = units.units_id WHERE service_id = ? AND info.status = ?',
      [serviceid, "active"]
    )
    
    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/units/get/:unitid', verifyAccessToken, async (req,res) => {
  const { unitid } = req.params;
  try {
    const [result] = await pool.query(
      'SELECT units.units_id, units.service_id, units.unit_code, units.plat_number, info.latitude, info.longitude, info.status FROM units  JOIN units_info info ON info.units_id = units.units_id WHERE units.units_id = ?;',
      [unitid]
    )

    const [report] = await pool.query(
      'SELECT reports.*, assesment.deskripsi FROM reports JOIN assesment ON assesment.id = reports.assesment_id WHERE assigned_unit_id = ? AND reports.ended_at IS NULL;',
      [unitid]
    )

    const set = {
      unit_data : result, 
      report_data : report
    }

    return res.status(200).send(set);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/units/status/get/:unitid', verifyAccessToken, async (req,res) => {
  const { unitid } = req.params;
  try {

    const [result] = await pool.query(
      'SELECT status FROM units_info WHERE units_id = ?;',
      [unitid]
    )

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.get('/admin/units/progress/get/:reportid', verifyAccessToken, async (req,res) => {
  const { reportid } = req.params;
  try {

    const [result] = await pool.query(
      'SELECT progress FROM reports WHERE report_id = ?;',
      [reportid]
    )

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.put('/admin/units/status/put', verifyAccessToken, async (req, res) => {
  const { unitid, status } = req.body;
  try {

    const [result] = await pool.query(
      'UPDATE units_info SET status = ? WHERE units_id = ?;',
      [status, unitid]
    )

    console.log(result);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.put('/admin/units/progress/put', verifyAccessToken, async (req, res) => {
  const { progress, reportid } = req.body;
  try {
    console.log(progress, reportid);
    const [result] = await pool.query(
      'UPDATE reports SET progress = ? WHERE report_id = ?;',
      [progress, reportid]
    )

    console.log(result);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

router.put('/admin/reports/assignedunit/put', verifyAccessToken, async (req, res) => {
  const { reportid, unitid } = req.body;
  try {

    const [result] = await pool.query(
      'UPDATE reports SET assigned_unit_id = ? WHERE report_id = ?;',
      [unitid, reportid]
    )

    console.log(result);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})


router.post('/admin/units/register/units', verifyAccessToken, async (req,res) => {
  const { serviceid, password, platnumber, companyid, vehicletype } = req.body;

  try {
    console.log('youwere here');
    const [rows] = await pool.query(
      'SELECT * FROM units WHERE plat_number = ?;', [platnumber]
    );

    if (rows.length > 0 ) {
      console.log('Already exists');
      return res.status(400).send('Email already registered');
    };

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO units (service_id,password, plat_number, company_id, vehicle_type) VALUES (?,?,?,?,?);',
      [serviceid, hashedPassword, platnumber, companyid, vehicletype]
    )

    console.log('you succeed!');
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
})

export default router;