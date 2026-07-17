/**
 * Seed dữ liệu mẫu off-chain (MongoDB) khớp với 3 batch đã tạo bằng
 * blockchain/scripts/seedLocalData.js — chạy SAU khi đã seed on-chain.
 *
 * Chạy: node scripts/seedSampleData.js
 * (cần điền đúng CONTRACT_ADDRESS mới trong .env trước khi chạy)
 */
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const BatchMetadata = require("../models/BatchMetadata");

// Địa chỉ 4 tài khoản mặc định của Hardhat Network (CHỈ dùng cho mạng local,
// private key của các tài khoản này ai cũng biết công khai — KHÔNG BAO GIỜ
// dùng trên Sepolia/mainnet với tiền thật).
const ACCOUNTS = {
  admin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  producer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  transporter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  distributor: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
};

async function seed() {
  await connectDB();

  // --- Users ---
  const users = [
    { walletAddress: ACCOUNTS.admin, role: "admin", name: "Quản trị viên demo" },
    { walletAddress: ACCOUNTS.producer, role: "producer", name: "Nông trại Hòa Lộc" },
    { walletAddress: ACCOUNTS.transporter, role: "transporter", name: "Vận tải Tiền Giang" },
    { walletAddress: ACCOUNTS.distributor, role: "distributor", name: "Kho phân phối TP.HCM" },
  ];

  for (const u of users) {
    await User.findOneAndUpdate(
      { walletAddress: u.walletAddress.toLowerCase() },
      { ...u, walletAddress: u.walletAddress.toLowerCase(), isActive: true },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Đã seed ${users.length} tài khoản mẫu`);

  // --- BatchMetadata — khớp 3 batchId đã tạo on-chain (1, 2, 3) ---
  const batches = [
    {
      batchId: 1,
      productName: "Xoài cát Hòa Lộc — Lô demo 1",
      description: "Xoài cát chín tự nhiên, thu hoạch từ vườn đạt chuẩn VietGAP.",
      quantity: 850,
      unit: "kg",
      declaredAddress: "Xã Hòa Lộc, Cái Bè, Tiền Giang",
      referenceLocation: { lat: 10.3969, lng: 106.0483 },
      createdBy: ACCOUNTS.producer.toLowerCase(),
    },
    {
      batchId: 2,
      productName: "Xoài cát Hòa Lộc — Lô demo 2",
      description: "Lô hàng đang trong quá trình vận chuyển tới kho phân phối.",
      quantity: 620,
      unit: "kg",
      declaredAddress: "Xã Hòa Lộc, Cái Bè, Tiền Giang",
      referenceLocation: { lat: 10.3969, lng: 106.0483 },
      createdBy: ACCOUNTS.producer.toLowerCase(),
    },
    {
      batchId: 3,
      productName: "Xoài cát Hòa Lộc — Lô demo 3",
      description: "Lô hàng mới khởi tạo, đang chờ đơn vị vận chuyển xác nhận.",
      quantity: 400,
      unit: "kg",
      declaredAddress: "Xã Hòa Lộc, Cái Bè, Tiền Giang",
      referenceLocation: { lat: 10.3969, lng: 106.0483 },
      createdBy: ACCOUNTS.producer.toLowerCase(),
    },
  ];

  for (const b of batches) {
    await BatchMetadata.findOneAndUpdate({ batchId: b.batchId }, b, { upsert: true, new: true });
  }
  console.log(`✅ Đã seed ${batches.length} lô hàng mẫu (metadata off-chain)`);

  console.log("\nHoàn tất! Giờ có thể:");
  console.log("- Import 4 địa chỉ ví trên vào MetaMask (dùng private key mặc định của Hardhat)");
  console.log("- Mở /admin để thấy danh sách tài khoản mẫu");
  console.log("- Mở /lookup/1, /lookup/2, /lookup/3 để xem 3 lô hàng ở 3 trạng thái khác nhau");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed thất bại:", err);
  process.exit(1);
});
