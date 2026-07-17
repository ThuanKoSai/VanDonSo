const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { requireAdminSignature } = require("../middleware/adminAuth");

/**
 * GET để công khai đọc (chỉ liệt kê ĐỊA CHỈ VÍ + vai trò, không phải dữ
 * liệu nhạy cảm) — nguồn sự thật thật sự về quyền vẫn là AccessControl
 * trên smart contract, đây chỉ là bản cache off-chain để hiển thị nhanh.
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(
      users.map((u) => ({
        walletAddress: u.walletAddress,
        role: u.role.charAt(0).toUpperCase() + u.role.slice(1), // "producer" -> "Producer"
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString().slice(0, 10),
      }))
    );
  } catch (err) {
    console.error("Lỗi khi lấy danh sách user:", err);
    res.status(500).json({ error: "Không thể tải danh sách." });
  }
});

/**
 * POST đồng bộ lại cache off-chain SAU KHI đã grantRole() thành công
 * on-chain ở phía frontend — route này KHÔNG tự cấp quyền, chỉ ghi lại để
 * hiển thị. Bắt buộc chữ ký Admin để tránh ai cũng ghi được vào bảng.
 */
router.post("/users", requireAdminSignature, async (req, res) => {
  const { walletAddress, role } = req.body;

  if (!walletAddress || !role) {
    return res.status(400).json({ error: "Thiếu walletAddress hoặc role." });
  }

  try {
    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      {
        walletAddress: walletAddress.toLowerCase(),
        role: role.toLowerCase(),
        isActive: true,
        name: `Ví ${walletAddress.slice(0, 6)}`,
      },
      { upsert: true, new: true }
    );
    res.status(201).json(user);
  } catch (err) {
    console.error("Lỗi khi lưu user:", err);
    res.status(500).json({ error: "Không thể lưu địa chỉ ví." });
  }
});

module.exports = router;
