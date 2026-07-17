const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainTraceability", function () {
  let contract;
  let admin, producer, transporter, distributor, stranger;

  const PRODUCER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"));
  const TRANSPORTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TRANSPORTER_ROLE"));
  const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));

  // Helper: tạo hash 32-byte hợp lệ cho photoHash (bytes32) từ 1 label bất kỳ
  function fakeHash(label) {
    return ethers.keccak256(ethers.toUtf8Bytes(label));
  }
  const ZERO_HASH = ethers.ZeroHash; // bytes32(0)

  beforeEach(async function () {
    [admin, producer, transporter, distributor, stranger] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("SupplyChainTraceability");
    contract = await Contract.deploy();
    await contract.waitForDeployment();

    await contract.grantRole(PRODUCER_ROLE, producer.address);
    await contract.grantRole(TRANSPORTER_ROLE, transporter.address);
    await contract.grantRole(DISTRIBUTOR_ROLE, distributor.address);
  });

  describe("Phân quyền (AccessControl)", function () {
    it("Admin cấp quyền đúng cho từng vai trò", async function () {
      expect(await contract.hasRole(PRODUCER_ROLE, producer.address)).to.equal(true);
      expect(await contract.hasRole(TRANSPORTER_ROLE, transporter.address)).to.equal(true);
      expect(await contract.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.equal(true);
    });

    it("Địa chỉ lạ (stranger) không có quyền nào", async function () {
      expect(await contract.hasRole(PRODUCER_ROLE, stranger.address)).to.equal(false);
    });

    it("Chỉ Producer mới tạo được lô hàng — người không có quyền bị revert", async function () {
      await expect(
        contract.connect(stranger).createBatch("Xoai cat", "Cai Be, Tien Giang", 10396900, 106048300)
      ).to.be.reverted;
    });

    it("Admin thu hồi quyền thì địa chỉ đó không ghi được nữa", async function () {
      await contract.revokeRole(PRODUCER_ROLE, producer.address);
      await expect(
        contract.connect(producer).createBatch("Xoai cat", "Cai Be", 10396900, 106048300)
      ).to.be.reverted;
    });
  });

  describe("Tạo lô hàng (createBatch)", function () {
    it("Producer tạo lô hàng thành công, batchId bắt đầu từ 1", async function () {
      const tx = await contract
        .connect(producer)
        .createBatch("Xoai cat Hoa Loc", "Cai Be, Tien Giang", 10396900, 106048300);
      await tx.wait();

      const batch = await contract.batches(1);
      expect(batch.batchId).to.equal(1);
      expect(batch.productName).to.equal("Xoai cat Hoa Loc");
      expect(batch.producer).to.equal(producer.address);
      expect(batch.currentStatus).to.equal(0); // Stage.Created
    });

    it("Lịch sử ghi 1 bản ghi Created ngay khi tạo lô hàng", async function () {
      await contract.connect(producer).createBatch("Xoai cat", "Cai Be", 10396900, 106048300);
      const history = await contract.getBatchHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].status).to.equal(0); // Created
      expect(history[0].actor).to.equal(producer.address);
    });

    // --- Test case mới: validate input (fix #4 sau audit bảo mật) ---
    it("Không cho tạo lô hàng với tên sản phẩm rỗng", async function () {
      await expect(
        contract.connect(producer).createBatch("", "Cai Be", 10396900, 106048300)
      ).to.be.revertedWith("Ten san pham khong duoc de trong");
    });

    it("Không cho tạo lô hàng với địa chỉ kho rỗng", async function () {
      await expect(
        contract.connect(producer).createBatch("Xoai cat", "", 10396900, 106048300)
      ).to.be.revertedWith("Dia chi kho khong duoc de trong");
    });

    it("Không cho tạo lô hàng với vĩ độ tham chiếu vô lý (ngoài [-90,90])", async function () {
      await expect(
        contract.connect(producer).createBatch("Xoai cat", "Cai Be", 999_000_000, 106048300)
      ).to.be.revertedWith("Vi do tham chieu khong hop le");
    });

    it("Không cho tạo lô hàng với kinh độ tham chiếu vô lý (ngoài [-180,180])", async function () {
      await expect(
        contract.connect(producer).createBatch("Xoai cat", "Cai Be", 10396900, 999_000_000)
      ).to.be.revertedWith("Kinh do tham chieu khong hop le");
    });
  });

  describe("Cập nhật trạng thái + Proof of Location (updateStatus)", function () {
    beforeEach(async function () {
      await contract.connect(producer).createBatch("Xoai cat", "Cai Be", 10396900, 106048300);
    });

    it("Transporter ghi InTransit thành công kèm dữ liệu Proof of Location", async function () {
      const hash = fakeHash("batch1-intransit");
      await contract.connect(transporter).updateStatus(1, 1, hash, "QmCidAbc", 10045200, 105746900);

      const batch = await contract.batches(1);
      expect(batch.currentStatus).to.equal(1); // InTransit

      const history = await contract.getBatchHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1].photoHash).to.equal(hash);
      expect(history[1].photoCid).to.equal("QmCidAbc");
      expect(history[1].role).to.equal(2); // Role.Transporter
    });

    it("Distributor không được ghi trạng thái InTransit (sai vai trò)", async function () {
      await expect(
        contract.connect(distributor).updateStatus(1, 1, fakeHash("x"), "QmCid", 0, 0)
      ).to.be.revertedWith("Dia chi khong co quyen thao tac trang thai nay");
    });

    it("Không thể nhảy cóc trạng thái (Created -> InWarehouse thẳng)", async function () {
      await expect(
        contract.connect(distributor).updateStatus(1, 2, fakeHash("x"), "QmCid", 0, 0)
      ).to.be.revertedWith("Sai thu tu trang thai");
    });

    it("Không thể cập nhật lại về Created", async function () {
      await expect(
        contract.connect(producer).updateStatus(1, 0, fakeHash("x"), "QmCid", 0, 0)
      ).to.be.revertedWith("Khong the quay lai trang thai Created");
    });

    it("Bắt buộc phải có photoHash và photoCid (không được để trống/rỗng)", async function () {
      await expect(
        contract.connect(transporter).updateStatus(1, 1, ZERO_HASH, "QmCid", 0, 0)
      ).to.be.revertedWith("Thieu du lieu Proof of Location");

      await expect(
        contract.connect(transporter).updateStatus(1, 1, fakeHash("x"), "", 0, 0)
      ).to.be.revertedWith("Thieu IPFS CID cua anh bang chung");
    });

    // --- Test case mới: validate toạ độ ở updateStatus (fix #4) ---
    it("Không cho ghi Proof of Location với toạ độ vô lý", async function () {
      await expect(
        contract.connect(transporter).updateStatus(1, 1, fakeHash("x"), "QmCid", 999_000_000, 0)
      ).to.be.revertedWith("Vi do khong hop le");

      await expect(
        contract.connect(transporter).updateStatus(1, 1, fakeHash("x"), "QmCid", 0, 999_000_000)
      ).to.be.revertedWith("Kinh do khong hop le");
    });

    it("Đi đúng tuần tự đủ 4 trạng thái thành công", async function () {
      await contract.connect(transporter).updateStatus(1, 1, fakeHash("h1"), "c1", 1, 1);
      await contract.connect(distributor).updateStatus(1, 2, fakeHash("h2"), "c2", 2, 2);
      await contract.connect(distributor).updateStatus(1, 3, fakeHash("h3"), "c3", 3, 3);

      const batch = await contract.batches(1);
      expect(batch.currentStatus).to.equal(3); // Delivered

      const history = await contract.getBatchHistory(1);
      expect(history.length).to.equal(4); // Created + 3 bước cập nhật
    });

    it("Không thể cập nhật lô hàng không tồn tại", async function () {
      await expect(
        contract.connect(transporter).updateStatus(999, 1, fakeHash("h"), "c", 0, 0)
      ).to.be.revertedWith("Lo hang khong ton tai");
    });
  });

  describe("Tra cứu công khai (getBatchHistory — hàm view)", function () {
    it("Bất kỳ ai cũng đọc được lịch sử, kể cả không có vai trò nào", async function () {
      await contract.connect(producer).createBatch("Xoai cat", "Cai Be", 10396900, 106048300);
      const history = await contract.connect(stranger).getBatchHistory(1);
      expect(history.length).to.equal(1);
    });
  });
});
