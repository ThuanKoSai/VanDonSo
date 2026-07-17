const mongoose = require("mongoose");

/**
 * BatchMetadata: thông tin PHỤ của lô hàng, không cần bất biến nên không
 * đưa lên chain (tránh tốn gas). Nguồn sự thật về trạng thái/lịch sử vẫn
 * là smart contract — collection này chỉ để tra cứu nhanh + hiển thị UI.
 */
const BatchMetadataSchema = new mongoose.Schema(
  {
    // Trùng với batchId sinh ra từ smart contract (contract là nguồn sự thật)
    batchId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      default: null,
    },

    unit: {
      type: String, // vd: "kg", "thùng", "tấn"
      default: "",
    },

    // Địa chỉ gốc do Producer khai báo (dạng text)
    declaredAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // Tọa độ tham chiếu — kết quả geocode từ declaredAddress qua Nominatim
    // Dùng để đối chiếu Haversine với GPS thật lúc Proof of Location
    referenceLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    // Chứng từ/ảnh phụ (không phải ảnh Proof of Location — những ảnh đó nằm
    // trong bản ghi on-chain riêng, đây là chứng từ bổ sung như hóa đơn, giấy kiểm định)
    extraDocuments: [
      {
        name: { type: String, trim: true },
        ipfsCid: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Địa chỉ ví Producer đã tạo lô hàng (đối chiếu nhanh, không cần gọi chain)
    createdBy: {
      type: String,
      lowercase: true,
      required: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Địa chỉ ví không hợp lệ"],
    },

    // Tx hash lúc gọi createBatch() — tiện để link thẳng Etherscan từ UI
    createTxHash: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BatchMetadata", BatchMetadataSchema);
