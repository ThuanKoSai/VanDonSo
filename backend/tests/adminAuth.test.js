/**
 * Test độc lập (không cần DB/RPC) cho middleware/adminAuth.js — phần bảo
 * mật quan trọng nhất của backend. Chạy: node test-adminAuth.js
 */
const { Wallet } = require("ethers");
const { requireAdminSignature, ADMIN_SIGN_MESSAGE } = require("../middleware/adminAuth");

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

async function run() {
  let passed = 0;
  let failed = 0;

  function assert(cond, label) {
    if (cond) { passed++; console.log("✅", label); }
    else { failed++; console.error("❌", label); }
  }

  const adminWallet = Wallet.createRandom();
  const strangerWallet = Wallet.createRandom();
  process.env.ADMIN_WALLET_ADDRESS = adminWallet.address;

  // Case 1: chữ ký hợp lệ, đúng địa chỉ Admin -> phải cho qua (next() được gọi)
  {
    const signature = await adminWallet.signMessage(ADMIN_SIGN_MESSAGE);
    const req = { header: (name) => ({ "x-wallet-address": adminWallet.address, "x-wallet-signature": signature }[name]) };
    const res = mockRes();
    let nextCalled = false;
    requireAdminSignature(req, res, () => { nextCalled = true; });
    assert(nextCalled === true, "Chữ ký hợp lệ của Admin -> cho qua (next() được gọi)");
    assert(req.walletAddress === adminWallet.address, "req.walletAddress được gán đúng địa chỉ đã xác thực");
  }

  // Case 2: chữ ký hợp lệ NHƯNG không phải ví Admin -> phải bị chặn 403
  {
    const signature = await strangerWallet.signMessage(ADMIN_SIGN_MESSAGE);
    const req = { header: (name) => ({ "x-wallet-address": strangerWallet.address, "x-wallet-signature": signature }[name]) };
    const res = mockRes();
    let nextCalled = false;
    requireAdminSignature(req, res, () => { nextCalled = true; });
    assert(nextCalled === false, "Ví lạ (không phải Admin) -> KHÔNG cho qua");
    assert(res.statusCode === 403, "Trả về đúng mã lỗi 403 (Forbidden) cho ví không có quyền Admin");
  }

  // Case 3: giả mạo — khai địa chỉ Admin nhưng chữ ký thực chất của ví lạ -> phải bị chặn
  {
    const signature = await strangerWallet.signMessage(ADMIN_SIGN_MESSAGE);
    const req = { header: (name) => ({ "x-wallet-address": adminWallet.address, "x-wallet-signature": signature }[name]) };
    const res = mockRes();
    let nextCalled = false;
    requireAdminSignature(req, res, () => { nextCalled = true; });
    assert(nextCalled === false, "Giả mạo địa chỉ (chữ ký không khớp) -> KHÔNG cho qua");
    assert(res.statusCode === 401, "Trả về đúng mã lỗi 401 khi chữ ký không khớp địa chỉ khai báo");
  }

  // Case 4: thiếu header -> phải bị chặn 401
  {
    const req = { header: () => undefined };
    const res = mockRes();
    let nextCalled = false;
    requireAdminSignature(req, res, () => { nextCalled = true; });
    assert(nextCalled === false, "Thiếu header chữ ký -> KHÔNG cho qua");
    assert(res.statusCode === 401, "Trả về đúng mã lỗi 401 khi thiếu header");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
