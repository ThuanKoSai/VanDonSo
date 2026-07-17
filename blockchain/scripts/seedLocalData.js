const hre = require("hardhat");

/**
 * Tạo dữ liệu mẫu trên mạng LOCAL (Hardhat Network) — miễn phí, tức thì,
 * không cần faucet/internet. Dùng để xem app chạy có dữ liệu ngay trong
 * lúc phát triển, TRƯỚC KHI deploy thật lên Sepolia để nộp bài.
 *
 * Chạy:
 *   Terminal 1: npx hardhat node
 *   Terminal 2: npx hardhat run scripts/seedLocalData.js --network localhost
 */

// Toạ độ thật để dữ liệu trông thuyết phục khi demo
const CAI_BE = { lat: 10.3969, lng: 106.0483 }; // kho gốc, Tiền Giang
const QL1A = { lat: 10.6, lng: 106.35 }; // điểm giữa đường
const TPHCM = { lat: 10.7769, lng: 106.7009 }; // kho phân phối

function toFixed(coord) {
  return Math.round(coord * 1e6);
}

// Hash/CID giả lập cho dữ liệu mẫu — KHÔNG phải ảnh thật, chỉ để demo
// giao diện. Khi dùng thật, giá trị này do frontend tự tính (xem lib/hash.js).
function fakeHash(label) {
  return "0x" + Buffer.from(label).toString("hex").padEnd(64, "0").slice(0, 64);
}
function fakeCid(label) {
  return "Qm" + Buffer.from(label).toString("hex").slice(0, 44).padEnd(44, "0");
}

async function main() {
  const [admin, producer, transporter, distributor] = await hre.ethers.getSigners();

  console.log("=== Tài khoản test (Hardhat mặc định, chỉ dùng local) ===");
  console.log("Admin      :", admin.address);
  console.log("Producer   :", producer.address);
  console.log("Transporter:", transporter.address);
  console.log("Distributor:", distributor.address);
  console.log("");

  // 1. Deploy contract
  const Contract = await hre.ethers.getContractFactory("SupplyChainTraceability");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deploy tại:", contractAddress);

  // 2. Cấp quyền
  const PRODUCER_ROLE = await contract.PRODUCER_ROLE();
  const TRANSPORTER_ROLE = await contract.TRANSPORTER_ROLE();
  const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

  await (await contract.grantRole(PRODUCER_ROLE, producer.address)).wait();
  await (await contract.grantRole(TRANSPORTER_ROLE, transporter.address)).wait();
  await (await contract.grantRole(DISTRIBUTOR_ROLE, distributor.address)).wait();
  console.log("✅ Đã cấp quyền cho 3 vai trò");
  console.log("");

  // 3. Batch #1 — đi hết 4 bước (để test trang tra cứu có đầy đủ lịch sử)
  console.log("--- Tạo Batch #1: Xoài cát Hòa Lộc — Lô demo 1 (Delivered) ---");
  let tx = await contract
    .connect(producer)
    .createBatch("Xoài cát Hòa Lộc — Lô demo 1", "Xã Hòa Lộc, Cái Bè, Tiền Giang", toFixed(CAI_BE.lat), toFixed(CAI_BE.lng));
  await tx.wait();

  await (
    await contract.connect(transporter).updateStatus(1, 1, fakeHash("batch1-intransit"), fakeCid("batch1-intransit"), toFixed(QL1A.lat), toFixed(QL1A.lng))
  ).wait();
  await (
    await contract.connect(distributor).updateStatus(1, 2, fakeHash("batch1-warehouse"), fakeCid("batch1-warehouse"), toFixed(TPHCM.lat), toFixed(TPHCM.lng))
  ).wait();
  await (
    await contract.connect(distributor).updateStatus(1, 3, fakeHash("batch1-delivered"), fakeCid("batch1-delivered"), toFixed(TPHCM.lat), toFixed(TPHCM.lng))
  ).wait();
  console.log("✅ Batch #1 hoàn tất — trạng thái Delivered, đủ 4 mốc lịch sử");

  // 4. Batch #2 — mới InTransit (để test trang Distributor "chờ xử lý")
  console.log("\n--- Tạo Batch #2: Xoài cát Hòa Lộc — Lô demo 2 (InTransit) ---");
  await (
    await contract
      .connect(producer)
      .createBatch("Xoài cát Hòa Lộc — Lô demo 2", "Xã Hòa Lộc, Cái Bè, Tiền Giang", toFixed(CAI_BE.lat), toFixed(CAI_BE.lng))
  ).wait();
  await (
    await contract.connect(transporter).updateStatus(2, 1, fakeHash("batch2-intransit"), fakeCid("batch2-intransit"), toFixed(QL1A.lat), toFixed(QL1A.lng))
  ).wait();
  console.log("✅ Batch #2 hoàn tất — trạng thái InTransit, đang chờ Distributor xác nhận");

  // 5. Batch #3 — chỉ mới Created (để test trang Transporter "chờ xử lý")
  console.log("\n--- Tạo Batch #3: Xoài cát Hòa Lộc — Lô demo 3 (Created) ---");
  await (
    await contract
      .connect(producer)
      .createBatch("Xoài cát Hòa Lộc — Lô demo 3", "Xã Hòa Lộc, Cái Bè, Tiền Giang", toFixed(CAI_BE.lat), toFixed(CAI_BE.lng))
  ).wait();
  console.log("✅ Batch #3 hoàn tất — trạng thái Created, đang chờ Transporter xác nhận");

  console.log("\n========================================");
  console.log("XONG! Cập nhật frontend/.env và backend/.env như sau:");
  console.log("========================================");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`SEPOLIA_RPC_URL=http://127.0.0.1:8545   (backend — đúng tên biến cũ nhưng trỏ tới local)`);
  console.log("");
  console.log("Trong frontend/src/lib/contract.js, sửa CONTRACT_ADDRESS thành địa chỉ ở trên.");
  console.log("");
  console.log("Import 3 tài khoản test vào MetaMask bằng private key mặc định của Hardhat");
  console.log("(xem trong output của lệnh `npx hardhat node` ở terminal 1, hoặc file PRIVATE-KEYS-LOCAL.md).");
  console.log("");
  console.log("Thêm mạng 'Hardhat Local' vào MetaMask: RPC http://127.0.0.1:8545, Chain ID 31337.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
