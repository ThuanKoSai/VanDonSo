// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChainTraceability
 * @notice Hợp đồng lõi cho hệ thống "Vận đơn số" — quản lý trạng thái lô hàng
 * và lưu các bản ghi Proof of Location (ảnh + GPS + giờ, đã hash off-chain
 * trước khi ghi lên đây).
 *
 * Kiến trúc hybrid: Producer/Transporter/Distributor tự ký giao dịch bằng
 * ví riêng (MetaMask) — contract không bao giờ nhận private key, chỉ nhận
 * dữ liệu đã được ký bởi đúng địa chỉ có quyền tương ứng.
 */
contract SupplyChainTraceability is AccessControl {
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // Khớp thứ tự với mảng BATCH_STATUS ở frontend (src/lib/contract.js)
    enum Stage {
        Created,
        InTransit,
        InWarehouse,
        Delivered
    }

    // Khớp thứ tự với mảng ROLES ở frontend
    enum Role {
        None,
        Producer,
        Transporter,
        Distributor
    }

    struct Batch {
        uint256 batchId;
        // producer (20 byte) + currentStatus (1 byte, enum Stage) được đặt
        // liền nhau để Solidity tự gộp chung 1 storage slot 32 byte — nếu
        // đặt currentStatus tách xa producer (như thiết kế ban đầu), mỗi
        // lô hàng tốn thêm 1 slot ghi thừa (~20,000 gas không cần thiết).
        address producer;
        Stage currentStatus;
        uint256 createdAt;
        // Tọa độ tham chiếu (geocode từ declaredAddress qua Nominatim ở frontend),
        // nhân 1e6 để lưu số nguyên vì Solidity không có kiểu số thực.
        int256 refLat;
        int256 refLng;
        string productName;
        string declaredAddress;
    }

    // Một bản ghi Proof of Location — trả về đúng thứ tự trường mà
    // frontend/contract.js đã khai báo trong ABI (getBatchHistory).
    struct ProofOfLocationRecord {
        address actor;
        Role role;
        Stage status;
        uint256 timestamp;
        int256 lat;
        int256 lng;
        // bytes32 thay vì string: SHA-256 luôn cho ra đúng 32 byte, dùng
        // kiểu cố định vừa rẻ gas hơn (không cần lưu độ dài + con trỏ động
        // như string) vừa ép kiểu đúng ngay từ ABI — không thể truyền
        // nhầm 1 chuỗi sai định dạng.
        bytes32 photoHash;
        string photoCid; // CID IPFS — độ dài có thể thay đổi giữa CIDv0/v1 nên giữ string
    }

    uint256 private _batchCounter;

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => ProofOfLocationRecord[]) private _batchHistory;

    event BatchCreated(uint256 indexed batchId, address indexed producer, string productName);
    event StatusUpdated(
        uint256 indexed batchId,
        address indexed actor,
        Stage indexed status,
        bytes32 photoHash,
        string photoCid,
        int256 lat,
        int256 lng
    );

    constructor() {
        // Người deploy contract là Admin mặc định — có quyền cấp/thu hồi
        // vai trò Producer/Transporter/Distributor cho người khác qua
        // grantRole()/revokeRole() (đã kế thừa sẵn từ AccessControl).
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Producer tạo lô hàng mới. Tọa độ tham chiếu (refLat/refLng)
     * được lưu ngay để dùng đối chiếu Haversine ở các bước xác thực sau.
     * @param productName Tên sản phẩm, không được để trống.
     * @param declaredAddress Địa chỉ kho gốc do Producer khai báo, không được để trống.
     * @param refLat Vĩ độ tham chiếu, đã nhân 1e6, hợp lệ trong khoảng [-90e6, 90e6].
     * @param refLng Kinh độ tham chiếu, đã nhân 1e6, hợp lệ trong khoảng [-180e6, 180e6].
     */
    function createBatch(
        string calldata productName,
        string calldata declaredAddress,
        int256 refLat,
        int256 refLng
    ) external onlyRole(PRODUCER_ROLE) returns (uint256) {
        require(bytes(productName).length > 0, "Ten san pham khong duoc de trong");
        require(bytes(declaredAddress).length > 0, "Dia chi kho khong duoc de trong");
        require(refLat >= -90e6 && refLat <= 90e6, "Vi do tham chieu khong hop le");
        require(refLng >= -180e6 && refLng <= 180e6, "Kinh do tham chieu khong hop le");

        _batchCounter += 1;
        uint256 batchId = _batchCounter;

        batches[batchId] = Batch({
            batchId: batchId,
            producer: msg.sender,
            currentStatus: Stage.Created,
            createdAt: block.timestamp,
            refLat: refLat,
            refLng: refLng,
            productName: productName,
            declaredAddress: declaredAddress
        });

        _batchHistory[batchId].push(
            ProofOfLocationRecord({
                actor: msg.sender,
                role: Role.Producer,
                status: Stage.Created,
                timestamp: block.timestamp,
                lat: refLat,
                lng: refLng,
                photoHash: bytes32(0),
                photoCid: ""
            })
        );

        emit BatchCreated(batchId, msg.sender, productName);
        return batchId;
    }

    /**
     * @notice Transporter/Distributor xác nhận một mốc mới, kèm bằng chứng
     * Proof of Location đã được tính hash off-chain (ảnh + GPS + giờ server).
     *
     * Quy tắc:
     * - Chỉ được đi ĐÚNG 1 bước tiếp theo trong chuỗi trạng thái
     *   (Created -> InTransit -> InWarehouse -> Delivered), không nhảy cóc,
     *   không lùi lại.
     * - Vai trò gọi hàm phải khớp với trạng thái đang cập nhật:
     *   InTransit chỉ Transporter được ghi; InWarehouse/Delivered chỉ
     *   Distributor được ghi.
     */
    function updateStatus(
        uint256 batchId,
        Stage status,
        bytes32 photoHash,
        string calldata photoCid,
        int256 lat,
        int256 lng
    ) external returns (bool) {
        require(batches[batchId].batchId != 0, "Lo hang khong ton tai");
        require(status != Stage.Created, "Khong the quay lai trang thai Created");

        Stage current = batches[batchId].currentStatus;
        require(uint8(status) == uint8(current) + 1, "Sai thu tu trang thai");

        Role callerRole = _resolveCallerRole(status);
        require(callerRole != Role.None, "Dia chi khong co quyen thao tac trang thai nay");

        require(photoHash != bytes32(0), "Thieu du lieu Proof of Location");
        require(bytes(photoCid).length > 0, "Thieu IPFS CID cua anh bang chung");
        require(lat >= -90e6 && lat <= 90e6, "Vi do khong hop le");
        require(lng >= -180e6 && lng <= 180e6, "Kinh do khong hop le");

        batches[batchId].currentStatus = status;

        _batchHistory[batchId].push(
            ProofOfLocationRecord({
                actor: msg.sender,
                role: callerRole,
                status: status,
                timestamp: block.timestamp,
                lat: lat,
                lng: lng,
                photoHash: photoHash,
                photoCid: photoCid
            })
        );

        emit StatusUpdated(batchId, msg.sender, status, photoHash, photoCid, lat, lng);
        return true;
    }

    /// @dev Xác định vai trò của người gọi có khớp với trạng thái đang cập nhật không.
    function _resolveCallerRole(Stage status) private view returns (Role) {
        if (status == Stage.InTransit && hasRole(TRANSPORTER_ROLE, msg.sender)) {
            return Role.Transporter;
        }
        if (
            (status == Stage.InWarehouse || status == Stage.Delivered) &&
            hasRole(DISTRIBUTOR_ROLE, msg.sender)
        ) {
            return Role.Distributor;
        }
        return Role.None;
    }

    /**
     * @notice Trả về toàn bộ lịch sử Proof of Location của 1 lô hàng.
     * Hàm view — miễn phí gas, dùng cho trang tra cứu công khai (Consumer),
     * không cần ví, không cần xác thực.
     */
    function getBatchHistory(uint256 batchId)
        external
        view
        returns (ProofOfLocationRecord[] memory)
    {
        return _batchHistory[batchId];
    }

    /// @notice Tổng số lô hàng đã tạo — tiện cho thống kê KPI ở dashboard.
    function totalBatches() external view returns (uint256) {
        return _batchCounter;
    }
}
