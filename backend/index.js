require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const serverTimeRoutes = require("./routes/serverTime");
const batchesRoutes = require("./routes/batches");
const adminRoutes = require("./routes/admin");
const producersRoutes = require("./routes/producers");
const transportersRoutes = require("./routes/transporters");
const distributorsRoutes = require("./routes/distributors");
const overviewRoutes = require("./routes/overview");

const app = express();

// Kết nối MongoDB (off-chain: User, BatchMetadata, cache...)
connectDB();

// CORS: mặc định mở cho dev local; khi deploy thật, đặt FRONTEND_ORIGIN
// trong .env về đúng domain frontend để không cho domain lạ gọi API.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// Health-check — các dịch vụ hosting free-tier (Render/Railway) ping định
// kỳ endpoint này để giữ server "thức", tránh sleep giữa các lượt demo.
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

// Log gọn cho từng request — tiện debug khi demo
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ name: "Vận đơn số API", status: "ok" });
});

app.use("/api/server-time", serverTimeRoutes);
app.use("/api/batches", batchesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/producers", producersRoutes);
app.use("/api/transporters", transportersRoutes);
app.use("/api/distributors", distributorsRoutes);
app.use("/api/overview", overviewRoutes);

// 404 cho route API không tồn tại
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Không tìm thấy API endpoint này." });
});

// Bắt lỗi chung — tránh crash cả server khi 1 route lỗi bất ngờ
app.use((err, req, res, next) => {
  console.error("Lỗi không xử lý:", err);
  res.status(500).json({ error: "Đã có lỗi xảy ra phía server." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[Vận đơn số API] Đang chạy tại http://localhost:${PORT}`);
});
