import express from "express";
import adminAuthRoutes from "./routes/admin/admin-auth.js";
import adminInboxRoutes from "./routes/admin/inbox.js";
import adminRoutes from "./routes/admin/admin.js";
import userAuthRoutes from "./routes/user/user-auth.js";
import userChatRoutes from "./routes/user/user-chat.js";
import userDataRoutes from "./routes/user/user-data.js";
import cors from "cors";
import { pool } from './database.js';

const app = express();

app.use(cors({
  origin: "*", // OK for now
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.get('/health/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT VERSION()');
    res.json({ ok: true, version: rows[0] });
  } catch (err) {
    console.error('DB ERROR:', err);
    res.status(500).json({
      message: err.message,
      code: err.code,
    });
  }
});


app.use(express.json());

app.use(adminAuthRoutes);
app.use(adminInboxRoutes);
app.use(adminRoutes);
app.use(userAuthRoutes);
app.use(userChatRoutes);
app.use(userDataRoutes);

// app.listen(5001, () => {
//   console.log("Server running on 5001");
// });

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

