/**
 * Script tạo tài khoản Admin đầu tiên trong database.
 * Chạy 1 lần khi setup dự án: node scripts/seedAdmin.js
 *
 * Lưu ý: script này CHỈ tạo bản ghi Admin trong MongoDB để backend biết
 * hiển thị quyền gì trên UI. Việc cấp quyền "onlyOwner" thật sự vẫn nằm
 * ở smart contract (địa chỉ deploy contract mặc định là owner).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function seedAdmin() {
  await connectDB();

  const adminWallet = process.env.ADMIN_WALLET_ADDRESS;
  if (!adminWallet) {
    console.error("Thiếu ADMIN_WALLET_ADDRESS trong file .env");
    process.exit(1);
  }

  const existing = await User.findOne({ walletAddress: adminWallet.toLowerCase() });
  if (existing) {
    console.log("Admin đã tồn tại:", existing.walletAddress);
  } else {
    const admin = await User.create({
      walletAddress: adminWallet,
      role: "admin",
      name: "Quản trị viên hệ thống",
      isActive: true,
    });
    console.log("Đã tạo Admin:", admin.walletAddress);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed thất bại:", err);
  process.exit(1);
});
