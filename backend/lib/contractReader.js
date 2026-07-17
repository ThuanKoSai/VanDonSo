const { JsonRpcProvider, Contract } = require("ethers");

/**
 * Backend CHỈ đọc dữ liệu on-chain (hàm view, miễn phí gas) — không bao giờ
 * giữ private key để ghi. Đây là nguyên tắc cốt lõi của kiến trúc hybrid đã
 * chốt từ đầu dự án: ghi dữ liệu luôn do chính người dùng ký qua MetaMask.
 */
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

// ABI tối thiểu cần cho các thao tác ĐỌC — khớp với contracts/SupplyChainTraceability.sol
// hasRole được thêm vào đây (không chỉ dùng cho fetch*) để routes/overview.js
// mượn lại được getContract()/getProvider() thay vì tự tạo kết nối riêng.
const CONTRACT_ABI = [
  "function totalBatches() view returns (uint256)",
  "function batches(uint256) view returns (uint256 batchId, address producer, uint8 currentStatus, uint256 createdAt, int256 refLat, int256 refLng, string productName, string declaredAddress)",
  "function getBatchHistory(uint256 batchId) view returns (tuple(address actor, uint8 role, uint8 status, uint256 timestamp, int256 lat, int256 lng, bytes32 photoHash, string photoCid)[])",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "event BatchCreated(uint256 indexed batchId, address indexed producer, string productName)",
  "event StatusUpdated(uint256 indexed batchId, address indexed actor, uint8 indexed status, bytes32 photoHash, string photoCid, int256 lat, int256 lng)",
];

const STATUS_NAMES = ["Created", "InTransit", "InWarehouse", "Delivered"];
const ROLE_NAMES = ["None", "Producer", "Transporter", "Distributor"];

let _provider = null;
let _contract = null;

function ensureConnected() {
  if (_contract) return;

  if (!process.env.SEPOLIA_RPC_URL || !CONTRACT_ADDRESS) {
    throw new Error(
      "Thiếu SEPOLIA_RPC_URL hoặc CONTRACT_ADDRESS trong .env — cấu hình trước khi gọi contract."
    );
  }

  _provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  _contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _provider);
}

function getContract() {
  ensureConnected();
  return _contract;
}

/**
 * Cho mượn lại provider (không chỉ contract) — thêm vào sau khi phát hiện
 * routes/overview.js tự tạo provider/contract RIÊNG thay vì dùng chung, dẫn
 * tới rủi ro phải sửa CONTRACT_ADDRESS/ABI ở 2 nơi nếu có thay đổi sau này.
 */
function getProvider() {
  ensureConnected();
  return _provider;
}

/** Chuyển tọa độ đã nhân 1e6 (lưu on-chain) về lại số thực để hiển thị */
function fromFixed(value) {
  return Number(value) / 1e6;
}

async function fetchBatch(batchId) {
  const contract = getContract();
  const b = await contract.batches(batchId);
  return {
    batchId: b.batchId.toString(),
    productName: b.productName,
    declaredAddress: b.declaredAddress,
    producer: b.producer,
    createdAt: new Date(Number(b.createdAt) * 1000).toISOString(),
    currentStatus: STATUS_NAMES[Number(b.currentStatus)],
    refLat: fromFixed(b.refLat),
    refLng: fromFixed(b.refLng),
  };
}

async function fetchBatchHistory(batchId) {
  const contract = getContract();
  const records = await contract.getBatchHistory(batchId);
  return records.map((r) => ({
    actor: r.actor,
    role: ROLE_NAMES[Number(r.role)],
    status: STATUS_NAMES[Number(r.status)],
    timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
    lat: fromFixed(r.lat),
    lng: fromFixed(r.lng),
    photoHash: r.photoHash,
    photoCid: r.photoCid,
  }));
}

async function fetchTotalBatches() {
  const contract = getContract();
  const total = await contract.totalBatches();
  return Number(total);
}

/**
 * Lấy transaction hash cho TỪNG bản ghi lịch sử — smart contract không tự
 * lưu txHash của chính nó (không thể, vì txHash chỉ có sau khi giao dịch
 * được đóng gói vào block), nên phải truy vấn lại qua event logs.
 *
 * Vì BatchCreated luôn là bản ghi đầu tiên và mỗi StatusUpdated ứng với
 * đúng 1 lần push tiếp theo vào mảng lịch sử, thứ tự sự kiện theo block/
 * log index sẽ khớp 1-1 với thứ tự phần tử trong getBatchHistory().
 * Cách này lấy trực tiếp từ chain — không phụ thuộc cache off-chain nào,
 * nên luôn đáng tin cậy để làm link "Xem giao dịch" cho người dùng.
 */
async function fetchTxHashesForBatch(batchId) {
  const contract = getContract();

  const [createdEvents, updatedEvents] = await Promise.all([
    contract.queryFilter(contract.filters.BatchCreated(batchId)),
    contract.queryFilter(contract.filters.StatusUpdated(batchId)),
  ]);

  const allEvents = [...createdEvents, ...updatedEvents].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
    return a.index - b.index;
  });

  return allEvents.map((e) => e.transactionHash);
}

/**
 * Lấy danh sách lô hàng do 1 địa chỉ Producer tạo — truy vấn TRỰC TIẾP
 * qua event logs on-chain (KHÔNG phụ thuộc MongoDB), vì đây là nguồn sự
 * thật duy nhất đảm bảo không bị thiếu/lệch dữ liệu.
 */
async function fetchBatchesByProducer(producerAddress) {
  const contract = getContract();
  const events = await contract.queryFilter(contract.filters.BatchCreated(null, producerAddress));
  return events.map((e) => ({
    batchId: e.args.batchId.toString(),
    productName: e.args.productName,
  }));
}

/** Lấy toàn bộ lô hàng đã từng tạo (dùng để lọc lô đang chờ Transporter xử lý) */
async function fetchAllBatchesBrief() {
  const contract = getContract();
  const events = await contract.queryFilter(contract.filters.BatchCreated());
  return events.map((e) => ({
    batchId: e.args.batchId.toString(),
    productName: e.args.productName,
  }));
}

module.exports = {
  getContract,
  getProvider,
  fetchBatch,
  fetchBatchHistory,
  fetchTotalBatches,
  fetchTxHashesForBatch,
  fetchBatchesByProducer,
  fetchAllBatchesBrief,
  STATUS_NAMES,
  ROLE_NAMES,
};
