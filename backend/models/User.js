const mongoose = require("mongoose");

/**
 * User: đại diện cho Producer / Transporter / Distributor / Admin.
 * KHÔNG lưu password hay private key — xác thực thực hiện qua chữ ký ví
 * (MetaMask ký một message, backend verify bằng ethers.verifyMessage).
 *
 * Consumer KHÔNG có bản ghi User vì không cần đăng nhập/ví — họ chỉ đọc
 * dữ liệu công khai qua batchId/QR.
 */
const UserSchema = new mongoose.Schema(
  {
    // Địa chỉ ví — định danh chính, luôn lưu dạng chữ thường để so sánh nhất quán
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Địa chỉ ví không hợp lệ"],
      index: true,
    },

    // Vai trò khớp với AccessControl trên smart contract (đồng bộ khi Admin grantRole)
    role: {
      type: String,
      enum: ["admin", "producer", "transporter", "distributor"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // true = quyền còn hiệu lực (đồng bộ trạng thái grantRole/revokeRole on-chain)
    // Giữ để hiển thị UI nhanh, nhưng nguồn sự thật cuối cùng vẫn là smart contract
    isActive: {
      type: Boolean,
      default: true,
    },

    // Lưu tx hash lúc Admin cấp quyền, để truy vết/kiểm chứng khi cần
    grantedByTxHash: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // tự thêm createdAt, updatedAt
);

module.exports = mongoose.model("User", UserSchema);
