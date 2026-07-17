/**
 * Hằng số giao diện dùng chung toàn app.
 *
 * Trước khi tách file này, 2 hằng số dưới đây bị lặp NGUYÊN VĂN ở 10+ file —
 * muốn đổi style focus hay đổi cổng API là phải tìm-thay từng nơi, rất dễ
 * sót. Gom về 1 chỗ: sửa 1 lần, ăn cả app.
 */
export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/** Nhãn + màu badge cho 4 trạng thái on-chain — dùng chung mọi trang. */
export const STATUS_META = {
  Created: { label: "Đã tạo", badge: "bg-paper3 text-inksoft", dot: "bg-inksoft" },
  InTransit: { label: "Đang vận chuyển", badge: "bg-cream text-goldtext", dot: "bg-gold" },
  InWarehouse: { label: "Đã nhập kho", badge: "bg-cream text-forest", dot: "bg-goldtext" },
  Delivered: { label: "Đã giao", badge: "bg-forest text-cream", dot: "bg-cream" },
};

export function formatTime(ts) {
  if (!ts) return "—";
  const n = Number(ts);
  const d = new Date(n < 1e12 ? n * 1000 : n);
  return isNaN(d.getTime()) ? String(ts) : d.toLocaleString("vi-VN");
}

export function shortenHash(h, n = 10) {
  return h ? `${h.slice(0, n)}...${h.slice(-6)}` : "—";
}

export const EXPLORER_TX = (hash) => `https://sepolia.etherscan.io/tx/${hash}`;
