import { Contract } from "ethers";

/**
 * TODO (Thành viên A): sau khi deploy contract, thay 2 giá trị dưới đây
 * bằng địa chỉ thật và ABI thật xuất ra từ Hardhat
 * (artifacts/contracts/SupplyChain.sol/SupplyChain.json).
 */
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";

// ABI đầy đủ, biên dịch thật từ contracts/SupplyChainTraceability.sol
// (xem thư mục blockchain/ — sau khi deploy, chỉ cần thay CONTRACT_ADDRESS ở trên,
// ABI này đã khớp sẵn, không cần đổi trừ khi sửa contract).
export const CONTRACT_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function PRODUCER_ROLE() view returns (bytes32)",
  "function TRANSPORTER_ROLE() view returns (bytes32)",
  "function DISTRIBUTOR_ROLE() view returns (bytes32)",
  "function totalBatches() view returns (uint256)",
  "function batches(uint256) view returns (uint256 batchId, address producer, uint8 currentStatus, uint256 createdAt, int256 refLat, int256 refLng, string productName, string declaredAddress)",
  "function createBatch(string productName, string declaredAddress, int256 refLat, int256 refLng) returns (uint256)",
  "function updateStatus(uint256 batchId, uint8 status, bytes32 photoHash, string photoCid, int256 lat, int256 lng) returns (bool)",
  "function getBatchHistory(uint256 batchId) view returns (tuple(address actor, uint8 role, uint8 status, uint256 timestamp, int256 lat, int256 lng, bytes32 photoHash, string photoCid)[])",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "event BatchCreated(uint256 indexed batchId, address indexed producer, string productName)",
  "event StatusUpdated(uint256 indexed batchId, address indexed actor, uint8 indexed status, bytes32 photoHash, string photoCid, int256 lat, int256 lng)",
];

/**
 * Trả về contract instance đã kết nối với signer (dùng để GHI dữ liệu —
 * người dùng sẽ được MetaMask yêu cầu ký mỗi lần gọi hàm này).
 */
export function getContractWithSigner(signer) {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Trả về contract instance chỉ ĐỌC (dùng ở trang tra cứu công khai,
 * không cần ví, không tốn gas — vì chỉ gọi các hàm `view`).
 * provider ở đây có thể là một JsonRpcProvider trỏ tới Infura/Alchemy,
 * không nhất thiết phải là window.ethereum.
 */
export function getContractReadOnly(provider) {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Khớp với thứ tự enum STAGE trong smart contract — giữ đồng bộ 2 bên
export const BATCH_STATUS = ["Created", "InTransit", "InWarehouse", "Delivered"];

// Khớp với enum ROLE trong smart contract
export const ROLES = ["None", "Producer", "Transporter", "Distributor"];
