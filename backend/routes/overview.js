const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();

const User = require("../models/User");
const { getContract, getProvider, STATUS_NAMES } = require("../lib/contractReader");

/**
 * Nhóm endpoint phục vụ giao diện mới (Dashboard thống kê, Lịch sử giao
 * dịch, Hồ sơ, kiểm tra vai trò lúc đăng nhập).
 *
 * Trước đây file này tự tạo provider/contract RIÊNG (ABI khai báo lại từ
 * đầu) thay vì dùng chung lib/contractReader.js — lý do ghi khi đó là "để
 * dễ đọc độc lập", nhưng đây là một vi phạm DRY thật: đổi CONTRACT_ADDRESS
 * hay ABI phải nhớ sửa ở 2 nơi. Đã sửa lại dùng chung getContract()/
 * getProvider() — contractReader.js giờ là NƠI DUY NHẤT khởi tạo kết nối
 * blockchain trong toàn bộ backend.
 */
const contract = getContract();
const provider = getProvider();

const ROLE_HASH = {
  admin: ethers.ZeroHash, // DEFAULT_ADMIN_ROLE
  producer: ethers.id("PRODUCER_ROLE"),
  transporter: ethers.id("TRANSPORTER_ROLE"),
  distributor: ethers.id("DISTRIBUTOR_ROLE"),
};

async function listAllBatches() {
  const total = Number(await contract.totalBatches());
  const out = [];
  for (let i = 1; i <= total; i++) {
    const b = await contract.batches(i);
    out.push({
      batchId: Number(b.batchId),
      productName: b.productName,
      declaredAddress: b.declaredAddress,
      currentStatus: STATUS_NAMES[Number(b.currentStatus)],
      createdAt: Number(b.createdAt),
      refLat: Number(b.refLat) / 1e6,
      refLng: Number(b.refLng) / 1e6,
    });
  }
  return out;
}

async function listTransactions(limit) {
  const [created, updated] = await Promise.all([
    contract.queryFilter(contract.filters.BatchCreated()),
    contract.queryFilter(contract.filters.StatusUpdated()),
  ]);

  const all = [
    ...created.map((e) => ({
      txHash: e.transactionHash,
      blockNumber: e.blockNumber,
      type: "Tạo lô hàng",
      batchId: Number(e.args.batchId),
    })),
    ...updated.map((e) => ({
      txHash: e.transactionHash,
      blockNumber: e.blockNumber,
      type: `Cập nhật → ${STATUS_NAMES[Number(e.args.status)] || "?"}`,
      batchId: Number(e.args.batchId),
    })),
  ]
    .sort((a, b) => b.blockNumber - a.blockNumber)
    .slice(0, limit);

  // Trước đây đoạn này gọi provider.getTransactionReceipt() TUẦN TỰ cho
  // từng giao dịch một trong vòng lặp — với limit mặc định 20, là 20 lần
  // chờ mạng nối tiếp nhau, cộng dồn có thể mất vài giây. Sửa lại: gom các
  // block cần hỏi (khử trùng lặp qua Set) và toàn bộ receipt thành 2 đợt
  // Promise.all, chạy song song thay vì nối đuôi nhau.
  const uniqueBlockNumbers = [...new Set(all.map((tx) => tx.blockNumber))];
  const blocks = await Promise.all(
    uniqueBlockNumbers.map((bn) => provider.getBlock(bn).catch(() => null))
  );
  const blockCache = new Map(uniqueBlockNumbers.map((bn, i) => [bn, blocks[i]]));

  const receipts = await Promise.all(
    all.map((tx) => provider.getTransactionReceipt(tx.txHash).catch(() => null))
  );

  all.forEach((tx, i) => {
    tx.timestamp = blockCache.get(tx.blockNumber)?.timestamp || null;
    tx.gasUsed = receipts[i] ? Number(receipts[i].gasUsed) : null;
  });

  return all;
}

/** Số liệu tổng quan cho Dashboard — 1 lời gọi trả đủ, frontend đỡ phải gọi lắt nhắt. */
router.get("/stats", async (req, res) => {
  try {
    const batches = await listAllBatches();
    const counts = { Created: 0, InTransit: 0, InWarehouse: 0, Delivered: 0 };
    batches.forEach((b) => { if (counts[b.currentStatus] !== undefined) counts[b.currentStatus]++; });

    const [network, blockNumber, recentTransactions] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      listTransactions(5),
    ]);

    res.json({
      totalBatches: batches.length,
      counts,
      recentBatches: [...batches].sort((a, b) => b.batchId - a.batchId).slice(0, 5),
      recentTransactions,
      network: {
        chainId: Number(network.chainId),
        blockNumber,
        contractAddress: process.env.CONTRACT_ADDRESS,
      },
    });
  } catch (err) {
    console.error("Lỗi stats:", err.message);
    res.status(500).json({ error: "Không đọc được dữ liệu thống kê từ blockchain." });
  }
});

/** Danh sách toàn bộ lô hàng — cho trang Lô hàng (tìm kiếm/lọc/sort làm ở client). */
router.get("/batches", async (req, res) => {
  try {
    res.json(await listAllBatches());
  } catch (err) {
    console.error("Lỗi list batches:", err.message);
    res.status(500).json({ error: "Không đọc được danh sách lô hàng." });
  }
});

/** Lịch sử giao dịch blockchain — cho trang Lịch sử Blockchain. */
router.get("/transactions", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  try {
    res.json(await listTransactions(limit));
  } catch (err) {
    console.error("Lỗi transactions:", err.message);
    res.status(500).json({ error: "Không đọc được lịch sử giao dịch." });
  }
});

/** Kiểm tra vai trò on-chain của 1 địa chỉ — dùng lúc đăng nhập + trang Hồ sơ. */
router.get("/roles/:address", async (req, res) => {
  const { address } = req.params;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Địa chỉ ví không hợp lệ." });
  }
  try {
    const roles = [];
    for (const [name, hash] of Object.entries(ROLE_HASH)) {
      if (await contract.hasRole(hash, address)) roles.push(name);
    }
    res.json({ address, roles });
  } catch (err) {
    console.error("Lỗi roles:", err.message);
    res.status(500).json({ error: "Không kiểm tra được vai trò trên blockchain." });
  }
});

/** Hồ sơ off-chain (tên hiển thị) — không nhạy cảm, chỉ đọc. */
router.get("/users/:address", async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.address.toLowerCase() })
      .lean()
      .catch(() => null);
    res.json(user ? { name: user.name, role: user.role, isActive: user.isActive } : null);
  } catch {
    res.json(null);
  }
});

module.exports = router;
