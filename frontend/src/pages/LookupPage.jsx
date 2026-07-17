import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Boxes, Search, ExternalLink, AlertTriangle, Check } from "lucide-react";
import { Card, StatusBadge, SkeletonRows } from "../components/Bits";
import VerificationStamp from "../components/VerificationStamp";
import { API_BASE_URL, FOCUS_RING, formatTime, shortenHash, EXPLORER_TX, STATUS_META } from "../lib/ui";

const ORDER = ["Created", "InTransit", "InWarehouse", "Delivered"];
const IPFS_GATEWAY = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;

function Stepper({ current }) {
  const idx = ORDER.indexOf(current);
  return (
    <div className="flex items-center">
      {ORDER.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <span
              className={
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold " +
                (i <= idx ? "bg-forest text-cream" : "bg-paper3 text-inksoft")
              }
            >
              {i < idx ? <Check size={16} /> : i + 1}
            </span>
            <span className={"mt-1.5 text-[11px] " + (i <= idx ? "text-ink font-medium" : "text-inksoft")}>
              {STATUS_META[s].label}
            </span>
          </div>
          {i < ORDER.length - 1 && (
            <div className={"flex-1 h-0.5 mx-2 mb-5 " + (i < idx ? "bg-forest" : "bg-rule")} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

/** Tra cứu công khai — KHÔNG cần đăng nhập, không cần ví. Đây là trang người tiêu dùng quét QR sẽ tới. */
export default function LookupPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(batchId || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!batchId) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/batches/${batchId}/history`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Không tải được dữ liệu.");
        if (!cancelled) setData(body);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [batchId]);

  function submit() {
    const id = input.trim().replace("#", "");
    if (/^\d+$/.test(id)) navigate(`/lookup/${id}`);
    else setError("Mã lô hàng phải là số, VD: 24");
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav công khai */}
      <header className="bg-paper2 border-b border-rule">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className={"flex items-center gap-2.5 font-bold text-ink " + FOCUS_RING}>
            <span className="w-9 h-9 rounded-sm bg-forest text-cream flex items-center justify-center"><Boxes size={20} /></span>
            Vận đơn số
          </Link>
          <Link to="/login" className={"text-sm font-medium text-forest hover:underline " + FOCUS_RING}>Đăng nhập</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-ink text-center mb-1">Tra cứu nguồn gốc lô hàng</h1>
        <p className="text-sm text-inksoft text-center mb-6">Không cần tài khoản — mọi dữ liệu đọc trực tiếp từ blockchain.</p>

        <div className="flex gap-2 max-w-md mx-auto mb-10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Nhập mã lô hàng, VD: 24"
            className={"flex-1 px-4 py-2.5 text-sm bg-paper2 border border-rule rounded-sm font-mono " + FOCUS_RING}
          />
          <button onClick={submit} className={"flex items-center gap-1.5 text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-5 " + FOCUS_RING}>
            <Search size={15} /> Tra cứu
          </button>
        </div>

        {error && <Card className="p-4 text-sm text-crimson text-center max-w-md mx-auto">{error}</Card>}
        {loading && <SkeletonRows count={3} height="h-24" />}

        {data && !loading && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <h2 className="font-display text-xl font-bold text-ink">{data.productName}</h2>
                <StatusBadge status={data.currentStatus} />
                <span className="font-mono text-xs text-inksoft ml-auto">Lô #{data.batchId}</span>
                {data.currentStatus === "Delivered" && <VerificationStamp size={86} />}
              </div>
              <Stepper current={data.currentStatus} />
              <div className="mt-6 pt-5 border-t border-rule text-sm text-inksoft">
                <b className="text-ink">Nguồn gốc:</b> {data.declaredAddress}
                {data.quantity && <span className="ml-4"><b className="text-ink">Số lượng:</b> {data.quantity} kg</span>}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-display font-semibold text-ink mb-5">Lịch sử Proof of Location</h3>
              <ol className="relative border-l-2 border-rule ml-2 space-y-7">
                {data.history.map((h, i) => (
                  <li key={i} className="pl-6 relative">
                    <span className={"absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-paper2 " + (STATUS_META[h.status]?.dot || "bg-inksoft")} aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-ink">{STATUS_META[h.status]?.label || h.status}</span>
                      <span className="text-xs text-inksoft">· {h.role}</span>
                      <span className="text-xs text-inksoft ml-auto">{formatTime(h.timestamp)}</span>
                    </div>
                    <div className="font-mono text-xs text-inksoft mb-1.5">{h.location}</div>
                    {h.flag && (
                      <div className="flex items-start gap-1.5 text-xs text-crimson bg-cream border border-crimson/40 rounded-sm px-2.5 py-2 mb-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {h.flagNote}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {h.txHash && (
                        <a href={EXPLORER_TX(h.txHash)} target="_blank" rel="noreferrer"
                          className={"inline-flex items-center gap-1 font-mono text-forest hover:underline " + FOCUS_RING}>
                          {shortenHash(h.txHash)} <ExternalLink size={11} />
                        </a>
                      )}
                      {h.photoCid && (
                        <a href={IPFS_GATEWAY(h.photoCid)} target="_blank" rel="noreferrer"
                          className={"font-mono text-inksoft hover:text-forest hover:underline " + FOCUS_RING}>
                          Ảnh bằng chứng (IPFS)
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 pt-4 border-t border-rule text-xs text-inksoft leading-relaxed">
                Mọi bản ghi trên đều nằm trên Ethereum Sepolia — bấm vào mã giao dịch để tự đối chiếu
                trên Etherscan, không cần tin tưởng hệ thống này.
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
