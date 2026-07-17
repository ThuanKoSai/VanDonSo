const mongoose = require("mongoose");

/**
 * ProofOfLocationCache: BẢN SAO (cache) của các bản ghi Proof of Location
 * đã ghi on-chain, đồng bộ lại mỗi khi có event mới từ smart contract
 * (lắng nghe qua contract.on("StatusUpdated", ...)).
 *
 * MỤC ĐÍCH DUY NHẤT: tăng tốc độ tra cứu (đáp ứng NFR "phản hồi dưới 3s")
 * mà không cần gọi RPC blockchain mỗi lần Consumer quét QR.
 *
 * QUAN TRỌNG: đây KHÔNG phải nguồn sự thật. Nếu dữ liệu ở đây bị sửa/xóa
 * thủ công trong database, KHÔNG ảnh hưởng gì đến tính bất biến thật sự —
 * vì hash gốc vẫn nằm trên smart contract. Route tra cứu công khai nên
 * luôn kèm link "Xác minh trên Etherscan" trỏ thẳng tới transaction gốc,
 * để người dùng không cần tin tưởng riêng cache này.
 *
 * TRẠNG THÁI TRIỂN KHAI (ghi rõ để không ai nhầm là bug khi đọc lại sau
 * này): Schema này đã ĐỊNH NGHĨA XONG nhưng CHƯA có route/service nào
 * thật sự ghi dữ liệu vào đây — routes/batches.js hiện đọc thẳng từ chain
 * mỗi lần, chưa dùng cache này. Đây là quyết định có chủ đích, không phải
 * thiếu sót: ở quy mô đồ án (vài chục lô hàng), đọc thẳng chain đã đủ
 * nhanh, trong khi triển khai cache đúng cách cần thêm một tiến trình nền
 * lắng nghe event liên tục (xử lý mất kết nối, backfill dữ liệu cũ trước
 * lúc listener bắt đầu chạy...) — độ phức tạp thêm vào không tương xứng
 * lợi ích ở quy mô hiện tại. Để dành làm hướng phát triển khi lên production.
 */
const ProofOfLocationCacheSchema = new mongoose.Schema(
  {
    batchId: {
      type: Number,
      required: true,
      index: true,
    },

    actorWallet: {
      type: String,
      lowercase: true,
      required: true,
    },

    role: {
      type: String,
      enum: ["producer", "transporter", "distributor"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Created", "InTransit", "InWarehouse", "Delivered"],
      required: true,
    },

    // Timestamp lấy từ server lúc ghi PoL (không phải giờ máy client)
    timestamp: {
      type: Date,
      required: true,
    },

    lat: { type: Number, required: true },
    lng: { type: Number, required: true },

    // Hash SHA-256 của (ảnh + lat + lng + timestamp) — trùng khớp với giá trị on-chain
    photoHash: {
      type: String,
      required: true,
    },

    photoCid: {
      type: String,
      required: true,
    },

    // true nếu khoảng cách so với referenceLocation (BatchMetadata) vượt ngưỡng
    distanceFlag: {
      type: Boolean,
      default: false,
    },

    distanceMeters: {
      type: Number,
      default: null,
    },

    // Bắt buộc lưu để người dùng luôn tự kiểm chứng lại được trên chain
    txHash: {
      type: String,
      required: true,
    },

    blockNumber: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Truy vấn phổ biến nhất: lấy toàn bộ lịch sử của 1 batch, sắp theo thời gian
ProofOfLocationCacheSchema.index({ batchId: 1, timestamp: 1 });

module.exports = mongoose.model("ProofOfLocationCache", ProofOfLocationCacheSchema);
