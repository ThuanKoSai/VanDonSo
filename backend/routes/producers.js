const express = require("express");
const router = express.Router();

const { fetchBatchesByProducer, fetchBatch } = require("../lib/contractReader");

/**
 * Danh sách lô hàng của 1 Producer — dùng cho trang "Lô hàng của tôi".
 *
 * QUAN TRỌNG: lấy trực tiếp từ event BatchCreated on-chain (KHÔNG qua
 * MongoDB), vì đây là nguồn dữ liệu luôn đúng và đầy đủ ngay từ giao dịch
 * đầu tiên — không phụ thuộc việc frontend có gọi thêm API lưu off-chain
 * hay không. Trạng thái hiện tại của từng lô cũng đọc lại từ chain để
 * đảm bảo luôn mới nhất.
 */
router.get("/:address/batches", async (req, res) => {
  const address = req.params.address;
  if (!address) {
    return res.status(400).json({ error: "Thiếu địa chỉ ví." });
  }

  try {
    const brief = await fetchBatchesByProducer(address);

    const batches = await Promise.all(
      brief.map(async ({ batchId, productName }) => {
        let currentStatus = "Created";
        let createdAt = null;
        try {
          const onChain = await fetchBatch(batchId);
          currentStatus = onChain.currentStatus;
          createdAt = onChain.createdAt;
        } catch {
          // Giữ giá trị mặc định nếu tạm thời không đọc lại được, không chặn danh sách
        }
        return { batchId, productName, status: currentStatus, createdAt };
      })
    );

    // Mới nhất lên trước
    batches.sort((a, b) => Number(b.batchId) - Number(a.batchId));

    res.json(batches);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách lô hàng của producer:", err);
    res.status(500).json({ error: "Không thể tải danh sách lô hàng." });
  }
});

module.exports = router;
