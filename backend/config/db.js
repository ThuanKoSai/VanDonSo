const mongoose = require("mongoose");

/**
 * Kết nối tới MongoDB.
 * Dùng biến môi trường MONGO_URI (xem .env.example).
 * Gọi 1 lần khi khởi động server (trong index.js).
 */
async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/supply-chain-traceability";

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
      // Các option này là mặc định từ Mongoose 6+, để rõ ràng cho người đọc code
      autoIndex: process.env.NODE_ENV !== "production", // tắt autoIndex ở production để tăng tốc
    });

    console.log(`[DB] Đã kết nối MongoDB: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("[DB] Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] MongoDB bị ngắt kết nối");
  });
}

module.exports = connectDB;
