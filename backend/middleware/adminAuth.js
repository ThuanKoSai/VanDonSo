const { verifyMessage } = require("ethers");

/**
 * Xác thực Admin bằng CHỮ KÝ VÍ, không dùng email/password.
 * Frontend cần: (1) MetaMask ký message cố định bên dưới, (2) gửi kèm
 * header x-wallet-address + x-wallet-signature trong request.
 *
 * Đây là cách xác thực chuẩn Web3 — chứng minh quyền sở hữu ví mà không
 * cần lộ private key hay dùng mật khẩu truyền thống.
 */
const ADMIN_SIGN_MESSAGE = "Xac thuc Admin - Van don so";

function requireAdminSignature(req, res, next) {
  const address = req.header("x-wallet-address");
  const signature = req.header("x-wallet-signature");

  if (!address || !signature) {
    return res.status(401).json({
      error: "Thiếu chữ ký xác thực. Vui lòng ký message qua MetaMask trước khi gọi API này.",
    });
  }

  try {
    const recovered = verifyMessage(ADMIN_SIGN_MESSAGE, signature);

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Chữ ký không khớp với địa chỉ ví đã khai báo." });
    }

    const adminAddress = (process.env.ADMIN_WALLET_ADDRESS || "").toLowerCase();
    if (recovered.toLowerCase() !== adminAddress) {
      return res.status(403).json({ error: "Địa chỉ ví này không có quyền Admin." });
    }

    req.walletAddress = recovered;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Chữ ký không hợp lệ." });
  }
}

module.exports = { requireAdminSignature, ADMIN_SIGN_MESSAGE };
