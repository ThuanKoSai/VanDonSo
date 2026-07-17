const express = require("express");
const router = express.Router();

/**
 * Trả về giờ hiện tại của SERVER, không phải giờ máy client — đây là mắt
 * xích bắt buộc trong quy trình Proof of Location (chống người dùng chỉnh
 * giờ máy để giả mạo thời điểm xác nhận).
 */
router.get("/", (req, res) => {
  res.json({ timestamp: Date.now() });
});

module.exports = router;
