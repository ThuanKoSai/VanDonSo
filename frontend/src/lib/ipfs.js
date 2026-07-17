/**
 * Upload ảnh lên IPFS qua Pinata.
 * TODO: điền PINATA_JWT thật vào file .env (xem .env.example ở backend),
 * KHÔNG hardcode key trực tiếp trong code khi deploy thật.
 */
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";

export async function uploadToIPFS(blob, filename = "proof-of-location.jpg") {
  if (!PINATA_JWT) {
    console.warn("Chưa cấu hình VITE_PINATA_JWT — dùng CID giả để demo.");
    return `Qm_DEMO_${Date.now().toString(36)}`;
  }

  const formData = new FormData();
  formData.append("file", blob, filename);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Upload IPFS thất bại. Vui lòng thử lại.");

  const data = await res.json();
  return data.IpfsHash; // đây chính là CID cần ghi lên smart contract
}
