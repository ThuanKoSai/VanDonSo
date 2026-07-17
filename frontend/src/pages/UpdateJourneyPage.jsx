import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Info, CheckCircle2 } from "lucide-react";
import { Card, SkeletonRows, PageHeader } from "../components/Bits";
import ProofOfLocationPanel from "../components/ProofOfLocationPanel";
import { useProofOfLocation } from "../hooks/useProofOfLocation";
import { useWallet } from "../context/WalletContext";
import { API_BASE_URL, FOCUS_RING } from "../lib/ui";

/**
 * Trang "Cập nhật hành trình" HỢP NHẤT — thay cho 2 trang Transporter/
 * Distributor riêng lẻ trước đây. Bước kế tiếp được suy ra từ trạng thái
 * HIỆN TẠI của lô hàng trên chain; nếu ví đang kết nối không đúng vai trò
 * cho bước đó, smart contract sẽ từ chối với thông báo rõ ràng — quyền
 * hạn nằm ở tầng contract, không phải ở việc giấu/hiện nút trên UI.
 */
const NEXT_STEP = {
  Created: { stage: 1, label: "Xác nhận nhận hàng", role: "Transporter", verb: "nhận hàng" },
  InTransit: { stage: 2, label: "Xác nhận nhập kho", role: "Distributor", verb: "nhập kho" },
  InWarehouse: { stage: 3, label: "Xác nhận giao hàng", role: "Distributor", verb: "giao hàng" },
};

export default function UpdateJourneyPage() {
  const { batchId } = useParams();
  const { wallet, connect } = useWallet();
  const pol = useProofOfLocation({ batchId });

  const [state, setState] = useState("loading"); // loading | ready | done_all | error
  const [step, setStep] = useState(null);
  const [productName, setProductName] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/batches/${batchId}/history`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProductName(data.productName || "");
        const next = NEXT_STEP[data.currentStatus];
        if (!next) { setState("done_all"); return; }
        setStep(next);
        setState("ready");
      })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [batchId]);

  return (
    <div className="max-w-xl">
      <Link to={`/shipments/${batchId}`} className={"inline-flex items-center gap-1 text-sm text-inksoft hover:text-ink mb-4 " + FOCUS_RING}>
        <ArrowLeft size={15} /> Chi tiết lô hàng
      </Link>

      <PageHeader
        title={state === "ready" ? step.label : "Cập nhật hành trình"}
        desc={productName ? `${productName} · Lô #${batchId}` : `Lô #${batchId}`}
      />

      {state === "loading" && <SkeletonRows count={3} height="h-20" />}

      {state === "error" && (
        <Card className="p-5 text-sm text-crimson">Không tải được trạng thái lô hàng. Vui lòng thử lại.</Card>
      )}

      {state === "done_all" && (
        <Card className="p-8 text-center">
          <CheckCircle2 size={36} className="mx-auto text-forest mb-3" />
          <div className="font-medium text-ink">Lô hàng đã hoàn tất hành trình</div>
          <p className="text-sm text-inksoft mt-1">Cả 4 trạng thái đã được ghi nhận — không còn bước nào cần cập nhật.</p>
        </Card>
      )}

      {state === "ready" && (
        <>
          <div className="flex gap-2.5 text-xs text-inksoft bg-cream border border-rule rounded-sm p-3.5 mb-4 leading-relaxed">
            <Info size={15} className="text-forest shrink-0 mt-0.5" />
            <span>
              Bước này dành cho vai trò <b>{step.role}</b>. Nếu ví của bạn không có quyền,
              smart contract sẽ từ chối giao dịch — phân quyền được thực thi on-chain.
            </span>
          </div>

          {!wallet && (
            <button onClick={connect} className={"w-full py-2.5 mb-4 rounded-sm text-sm font-medium text-forest bg-cream hover:bg-cream " + FOCUS_RING}>
              Kết nối MetaMask để ký xác nhận
            </button>
          )}

          <ProofOfLocationPanel
            pol={pol}
            signLabel={`${step.label} qua MetaMask`}
            onSign={() => pol.sign(step.stage, `Đã xác nhận ${step.verb} thành công!`)}
          />
        </>
      )}
    </div>
  );
}
