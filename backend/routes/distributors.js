const express = require("express");
const router = express.Router();

const { fetchAllBatchesBrief, fetchBatch } = require("../lib/contractReader");

/**
 * Danh sách lô hàng đang chờ Distributor xử lý — khác Transporter ở chỗ
 * Distributor có 2 hành động khác nhau tùy trạng thái hiện tại:
 *   - InTransit    -> cần xác nhận NHẬP KHO (chuyển sang InWarehouse)
 *   - InWarehouse  -> cần xác nhận GIAO HÀNG (chuyển sang Delivered)
 */
router.get("/:address/pending", async (req, res) => {
  try {
    const brief = await fetchAllBatchesBrief();

    const pending = [];
    for (const { batchId, productName } of brief) {
      try {
        const onChain = await fetchBatch(batchId);

        if (onChain.currentStatus === "InTransit") {
          pending.push({
            batchId,
            productName,
            nextStep: "Xác nhận nhập kho",
            nextStage: 2, // Stage.InWarehouse
            location: onChain.declaredAddress,
          });
        } else if (onChain.currentStatus === "InWarehouse") {
          pending.push({
            batchId,
            productName,
            nextStep: "Xác nhận giao hàng",
            nextStage: 3, // Stage.Delivered
            location: onChain.declaredAddress,
          });
        }
      } catch {
        // Bỏ qua batch nếu không đọc được on-chain, không chặn cả danh sách
      }
    }

    pending.sort((a, b) => Number(b.batchId) - Number(a.batchId));
    res.json(pending);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách chờ xử lý của Distributor:", err);
    res.status(500).json({ error: "Không thể tải danh sách." });
  }
});

module.exports = router;
