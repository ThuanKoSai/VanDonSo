const express = require("express");
const router = express.Router();

const { fetchBatch, fetchBatchHistory, fetchTxHashesForBatch } = require("../lib/contractReader");
const { haversineDistanceMeters, DISTANCE_THRESHOLD_METERS } = require("../lib/haversine");
const BatchMetadata = require("../models/BatchMetadata");

/**
 * Đây chính là "read bridge" đã thiết kế trong SRS: Consumer tra cứu qua
 * route này — KHÔNG cần ví, KHÔNG tốn gas, vì backend gọi hộ các hàm view
 * trên smart contract. Nguồn sự thật vẫn là contract; route này chỉ tổng
 * hợp lại cho dễ hiển thị + tính thêm distanceFlag.
 */
router.get("/:batchId/history", async (req, res) => {
  const batchId = Number(req.params.batchId);

  if (!Number.isInteger(batchId) || batchId <= 0) {
    return res.status(400).json({ error: "Mã lô hàng không hợp lệ." });
  }

  try {
    const [batch, history, txHashes] = await Promise.all([
      fetchBatch(batchId),
      fetchBatchHistory(batchId),
      fetchTxHashesForBatch(batchId),
    ]);

    if (!batch || batch.batchId === "0") {
      return res.status(404).json({ error: "Không tìm thấy lô hàng với mã này." });
    }

    // Metadata off-chain (mô tả, số lượng...) — chỉ để hiển thị thêm, không
    // ảnh hưởng tới tính đúng đắn của lịch sử/trạng thái (vẫn lấy từ chain)
    const metadata = await BatchMetadata.findOne({ batchId }).lean().catch(() => null);

    const enrichedHistory = history.map((entry, i) => {
      // Bản ghi Created chính là điểm tham chiếu — không tính lệch cho chính nó
      const isCreated = entry.status === "Created";
      const distance = isCreated
        ? 0
        : haversineDistanceMeters(entry.lat, entry.lng, batch.refLat, batch.refLng);
      const flag = !isCreated && distance > DISTANCE_THRESHOLD_METERS;

      return {
        status: entry.status,
        role: entry.role,
        // Không reverse-geocode theo thời gian thực (tránh phụ thuộc Nominatim
        // cho mỗi lượt tra cứu công khai) — hiển thị thẳng tọa độ, đủ để đối
        // chiếu và vẫn xác thực được qua bản đồ nếu cần.
        location: `${entry.lat.toFixed(4)}°N, ${entry.lng.toFixed(4)}°E`,
        timestamp: entry.timestamp,
        txHash: txHashes[i] || null,
        lat: entry.lat,
        lng: entry.lng,
        photoCid: entry.photoCid || null,
        photoHash: entry.photoHash || null,
        flag,
        flagNote: flag
          ? `Lệch ${Math.round(distance)}m so với địa chỉ khai báo — cần đối chiếu thủ công`
          : undefined,
      };
    });

    res.json({
      batchId: batch.batchId,
      productName: batch.productName,
      declaredAddress: batch.declaredAddress,
      currentStatus: batch.currentStatus,
      quantity: metadata?.quantity || null,
      description: metadata?.description || "",
      history: enrichedHistory,
    });
  } catch (err) {
    console.error("Lỗi khi đọc lịch sử lô hàng:", err);
    res.status(500).json({ error: "Không thể đọc dữ liệu từ blockchain. Vui lòng thử lại." });
  }
});

module.exports = router;
