import express from "express";
import adminAuthRoutes from "./routes/admin/admin-auth.js";
import adminInboxRoutes from "./routes/admin/inbox.js";
import adminRoutes from "./routes/admin/admin.js";
import userAuthRoutes from "./routes/user/user-auth.js";
import userChatRoutes from "./routes/user/user-chat.js";
import userDataRoutes from "./routes/user/user-data.js";

const app = express();

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

