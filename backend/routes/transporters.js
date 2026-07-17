const express = require("express");
const router = express.Router();

const { fetchAllBatchesBrief, fetchBatch } = require("../lib/contractReader");

/**
 * Danh sách lô hàng đang chờ Transporter xác nhận — lấy toàn bộ batch đã
 * tạo qua event on-chain, lọc những lô còn ở trạng thái "Created".
 *
 * Lưu ý: hệ thống hiện CHƯA có cơ chế giao việc cứng (gán 1 batch cho
 * đúng 1 địa chỉ Transporter) — bất kỳ ví có quyền TRANSPORTER_ROLE đều
 * thấy và xác nhận được mọi lô đang chờ. Tham số :address giữ chỗ cho
 * việc mở rộng phân công sau này.
 */
router.get("/:address/pending", async (req, res) => {
  try {
    const brief = await fetchAllBatchesBrief();

    const pending = [];
    for (const { batchId, productName } of brief) {
      try {
        const onChain = await fetchBatch(batchId);
        if (onChain.currentStatus === "Created") {
          pending.push({
            batchId,
            productName,
            nextStep: "Xác nhận nhận hàng",
            location: onChain.declaredAddress,
          });
        }
      } catch {
        // Bỏ qua batch nếu không đọc được on-chain, không chặn cả danh sách
      }
    }

    // Mới nhất lên trước
    pending.sort((a, b) => Number(b.batchId) - Number(a.batchId));

    res.json(pending);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách chờ xác nhận:", err);
    res.status(500).json({ error: "Không thể tải danh sách." });
  }
});

module.exports = router;
