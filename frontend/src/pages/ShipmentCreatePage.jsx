import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, MapPin, PenLine, CheckCircle2 } from "lucide-react";
import { Card, PageHeader } from "../components/Bits";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getContractWithSigner } from "../lib/contract";
import { geocodeAddress } from "../lib/geocode";
import { FOCUS_RING } from "../lib/ui";

export default function ShipmentCreatePage() {
  const { wallet, connect } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null); // {lat,lng,displayName}
  const [busy, setBusy] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null); // batchId sau khi thành công

  async function handleGeocode() {
    if (!address.trim()) return setError("Nhập địa chỉ trước khi xác định tọa độ.");
    setGeocoding(true);
    setError(null);
    try {
      setCoords(await geocodeAddress(address.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSubmit() {
    if (!wallet) return setError("Vui lòng kết nối MetaMask trước.");
    if (!name.trim()) return setError("Tên sản phẩm không được để trống.");
    if (!coords) return setError('Bấm "Xác định tọa độ" cho địa chỉ trước khi tạo.');

    setBusy(true);
    setError(null);
    try {
      const contract = getContractWithSigner(wallet.signer);
      const tx = await contract.createBatch(
        name.trim(),
        address.trim(),
        Math.round(coords.lat * 1e6),
        Math.round(coords.lng * 1e6)
      );
      const receipt = await tx.wait();

      // Lấy batchId từ event BatchCreated trong receipt
      let newId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "BatchCreated") newId = Number(parsed.args.batchId);
        } catch { /* log của contract khác — bỏ qua */ }
      }
      setCreated(newId);
      showToast("Đã tạo lô hàng trên blockchain!", "success");
    } catch (err) {
      const msg = err.reason || err.message || "Tạo lô hàng thất bại.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  // Màn hình thành công: hiện QR để in lên bao bì
  if (created !== null) {
    const lookupUrl = `${window.location.origin}/lookup/${created}`;
    return (
      <div className="max-w-lg">
        <Card className="p-8 text-center">
          <CheckCircle2 size={40} className="mx-auto text-forest mb-3" />
          <h1 className="font-display text-xl font-bold text-ink mb-1">Đã tạo Lô #{created}</h1>
          <p className="text-sm text-inksoft mb-6">In mã QR này lên bao bì — người tiêu dùng quét là tra cứu được ngay, không cần ví.</p>
          <div className="inline-block bg-paper2 border border-rule rounded-none p-4 mb-6">
            <QRCodeSVG value={lookupUrl} size={180} />
          </div>
          <div className="font-mono text-xs text-inksoft break-all mb-6">{lookupUrl}</div>
          <div className="flex justify-center gap-2.5">
            <button onClick={() => navigate(`/shipments/${created}`)} className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-5 py-2.5 " + FOCUS_RING}>
              Xem chi tiết
            </button>
            <button
              onClick={() => { setCreated(null); setName(""); setAddress(""); setCoords(null); }}
              className={"text-sm font-medium text-ink bg-paper3 hover:bg-rule rounded-sm px-5 py-2.5 " + FOCUS_RING}
            >
              Tạo lô khác
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link to="/shipments" className={"inline-flex items-center gap-1 text-sm text-inksoft hover:text-ink mb-4 " + FOCUS_RING}>
        <ArrowLeft size={15} /> Danh sách lô hàng
      </Link>
      <PageHeader title="Tạo lô hàng mới" desc="Ký giao dịch bằng ví Producer — ngày khởi tạo lấy tự động từ block" />

      <Card className="p-6 space-y-5">
        {!wallet && (
          <button onClick={connect} className={"w-full py-2.5 rounded-sm text-sm font-medium text-forest bg-cream hover:bg-cream " + FOCUS_RING}>
            Kết nối MetaMask để tạo lô hàng
          </button>
        )}

        <div>
          <label htmlFor="pname" className="block text-sm font-medium text-ink mb-1.5">Tên sản phẩm *</label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="VD: Xoài cát Hòa Lộc — vụ hè 2026"
            className={"w-full px-3.5 py-2.5 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING} />
        </div>

        <div>
          <label htmlFor="paddr" className="block text-sm font-medium text-ink mb-1.5">Địa chỉ nguồn gốc *</label>
          <div className="flex gap-2">
            <input id="paddr" value={address} onChange={(e) => { setAddress(e.target.value); setCoords(null); }}
              placeholder="VD: Xã Hòa Lộc, Cái Bè, Tiền Giang"
              className={"flex-1 px-3.5 py-2.5 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING} />
            <button onClick={handleGeocode} disabled={geocoding}
              className={"flex items-center gap-1.5 px-3.5 text-sm font-medium text-ink bg-paper3 hover:bg-rule rounded-sm disabled:opacity-60 " + FOCUS_RING}>
              <MapPin size={15} /> {geocoding ? "Đang tìm..." : "Xác định tọa độ"}
            </button>
          </div>
          {coords && (
            <div className="mt-2 text-xs text-inksoft">
              <span className="font-mono text-forest">{coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E</span>
              {coords.displayName && <span className="block mt-0.5 truncate">{coords.displayName}</span>}
            </div>
          )}
          <p className="mt-1.5 text-xs text-inksoft">
            Tọa độ này là điểm tham chiếu để đối chiếu Haversine cho mọi bước xác nhận sau.
          </p>
        </div>

        {error && <div className="text-sm text-crimson" role="alert">{error}</div>}

        <button onClick={handleSubmit} disabled={busy}
          className={"w-full flex items-center justify-center gap-2 py-3 rounded-sm bg-forest hover:bg-forestD text-cream text-sm font-medium disabled:opacity-60 " + FOCUS_RING}>
          <PenLine size={16} /> {busy ? "Đang chờ ký & xác nhận block..." : "Ký tạo lô hàng qua MetaMask"}
        </button>

        <p className="text-xs text-inksoft leading-relaxed">
          Chỉ các trường cần bất biến (tên, địa chỉ, tọa độ tham chiếu) được ghi on-chain để
          tiết kiệm gas — đây là thiết kế có chủ đích, mô tả chi tiết ở Chương 3 báo cáo.
        </p>
      </Card>
    </div>
  );
}
