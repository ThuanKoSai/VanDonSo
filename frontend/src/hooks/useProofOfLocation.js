import { useEffect, useRef, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getContractWithSigner } from "../lib/contract";
import { uploadToIPFS } from "../lib/ipfs";
import { API_BASE_URL } from "../lib/ui";
import {
  openCameraStream,
  captureFrame,
  getCurrentPosition,
  getServerTimestamp,
  computeProofOfLocationHash,
} from "../lib/hash";

export const POL_STEP = {
  IDLE: "idle",
  CAMERA_ON: "camera_on",
  CAPTURED: "captured",
  LOCATING: "locating",
  HASHING: "hashing",
  UPLOADING: "uploading",
  READY_TO_SIGN: "ready",
  SIGNING: "signing",
  DONE: "done",
};

export const POL_STEP_MESSAGE = {
  [POL_STEP.LOCATING]: "Đang khóa tín hiệu GPS...",
  [POL_STEP.HASHING]: "Đang tính mã băm bằng chứng...",
  [POL_STEP.UPLOADING]: "Đang tải ảnh lên IPFS...",
};

/**
 * Toàn bộ pipeline Proof of Location dùng chung cho Transporter và
 * Distributor: mở camera → chụp → GPS thật → giờ server → SHA-256 →
 * upload IPFS → ký MetaMask.
 *
 * Trước khi tách hook này, ~150 dòng logic dưới đây bị LẶP NGUYÊN VĂN ở
 * TransporterCapture.jsx và DistributorCapture.jsx — sửa 1 bug ở luồng
 * camera là phải nhớ sửa cả 2 nơi. Giờ chỉ còn 1 nguồn duy nhất.
 */
export function useProofOfLocation({ batchId }) {
  const { wallet } = useWallet();
  const { showToast } = useToast();

  const [step, setStep] = useState(POL_STEP.IDLE);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [hash, setHash] = useState(null);
  const [cid, setCid] = useState(null);
  const [txResult, setTxResult] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Tắt camera khi rời trang — tránh giữ quyền camera chạy nền
  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await openCameraStream();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep(POL_STEP.CAMERA_ON);
    } catch (err) {
      setError(err.message);
    }
  }

  async function capture() {
    setError(null);
    try {
      const blob = await captureFrame(videoRef.current);
      setPhotoUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setStep(POL_STEP.CAPTURED);

      setStep(POL_STEP.LOCATING);
      const pos = await getCurrentPosition();
      setPosition(pos);

      setStep(POL_STEP.HASHING);
      const timestamp = await getServerTimestamp(API_BASE_URL);
      const combinedHash = await computeProofOfLocationHash({
        photoBlob: blob,
        lat: pos.lat,
        lng: pos.lng,
        timestamp,
      });
      setHash(combinedHash);

      setStep(POL_STEP.UPLOADING);
      const ipfsCid = await uploadToIPFS(blob);
      setCid(ipfsCid);

      setStep(POL_STEP.READY_TO_SIGN);
    } catch (err) {
      setError(err.message);
      setStep(POL_STEP.CAMERA_ON);
    }
  }

  /**
   * Ký giao dịch updateStatus. `stage` do trang gọi quyết định:
   * Transporter luôn là 1 (InTransit); Distributor là 2 hoặc 3 tùy
   * trạng thái hiện tại của lô hàng trên chain.
   */
  async function sign(stage, successMessage) {
    if (!wallet) {
      setError("Vui lòng kết nối MetaMask trước khi ký xác nhận.");
      return;
    }
    setStep(POL_STEP.SIGNING);
    setError(null);
    try {
      const contract = getContractWithSigner(wallet.signer);
      const tx = await contract.updateStatus(
        batchId,
        stage,
        hash,
        cid,
        Math.round(position.lat * 1e6),
        Math.round(position.lng * 1e6)
      );
      const receipt = await tx.wait();
      setTxResult(receipt.hash);
      setStep(POL_STEP.DONE);
      showToast(successMessage || "Đã xác nhận thành công!", "success");
    } catch (err) {
      const msg = err.reason || err.message || "Ký giao dịch thất bại.";
      setError(msg);
      showToast(msg, "error");
      setStep(POL_STEP.READY_TO_SIGN);
    }
  }

  return {
    wallet,
    step,
    error,
    position,
    photoUrl,
    hash,
    txResult,
    videoRef,
    startCamera,
    capture,
    sign,
  };
}
