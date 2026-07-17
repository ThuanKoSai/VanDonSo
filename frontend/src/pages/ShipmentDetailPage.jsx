import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, ExternalLink, RefreshCw, AlertTriangle, Truck } from "lucide-react";
import { Card, StatusBadge, SkeletonRows, PageHeader } from "../components/Bits";
import MapView from "../components/MapView";
import { API_BASE_URL, FOCUS_RING, formatTime, shortenHash, EXPLORER_TX, STATUS_META } from "../lib/ui";

const IPFS_GATEWAY = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;

export default function ShipmentDetailPage() {
  const { batchId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/batches/${batchId}/history`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Không tải được dữ liệu.");
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [batchId]);

  const lookupUrl = `${window.location.origin}/lookup/${batchId}`;
  const canUpdate = data && data.currentStatus !== "Delivered";
  const mapPoints = (data?.history || [])
    .filter((h) => h.lat !== undefined && h.lng !== undefined)
    .map((h) => ({ lat: h.lat, lng: h.lng, label: `${STATUS_META[h.status]?.label || h.status} · ${formatTime(h.timestamp)}` }));

  return (
    <div>
      <Link to="/shipments" className={"inline-flex items-center gap-1 text-sm text-inksoft hover:text-ink mb-4 " + FOCUS_RING}>
        <ArrowLeft size={15} /> Danh sách lô hàng
      </Link>

      {error && <Card className="p-5 text-sm text-crimson">{error}</Card>}
      {loading && <SkeletonRows count={4} height="h-24" />}

      {data && !loading && (
        <>
          <PageHeader
            title={data.productName}
            desc={<span className="font-mono">Lô #{data.batchId}</span>}
          >
            <StatusBadge status={data.currentStatus} />
            {canUpdate && (
              <Link to={`/shipments/${batchId}/update`}
                className={"flex items-center gap-1.5 text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-4 py-2 " + FOCUS_RING}>
                <Truck size={15} /> Cập nhật hành trình
              </Link>
            )}
            <button onClick={load} aria-label="Tải lại" className={"p-2 text-inksoft bg-paper2 border border-rule rounded-sm hover:bg-paper " + FOCUS_RING}>
              <RefreshCw size={15} />
            </button>
          </PageHeader>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cột trái: thông tin + timeline */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink mb-4">Thông tin lô hàng</h2>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-inksoft">Địa chỉ khai báo</dt><dd className="font-medium text-ink">{data.declaredAddress}</dd></div>
                  <div><dt className="text-inksoft">Số lượng</dt><dd className="font-medium text-ink">{data.quantity ? `${data.quantity} kg` : "—"}</dd></div>
                  {data.description && (
                    <div className="sm:col-span-2"><dt className="text-inksoft">Mô tả</dt><dd className="text-ink">{data.description}</dd></div>
                  )}
                </dl>
              </Card>

              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink mb-5">Hành trình · Proof of Location</h2>
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
                        {h.photoHash && <span className="font-mono text-inksoft">hash {shortenHash(h.photoHash, 8)}</span>}
                        {h.photoCid && (
                          <a href={IPFS_GATEWAY(h.photoCid)} target="_blank" rel="noreferrer"
                            className={"font-mono text-inksoft hover:text-forest hover:underline " + FOCUS_RING}>
                            IPFS: {h.photoCid.slice(0, 10)}...
                          </a>
                        )}
                      </div>

                      {h.photoCid && (
                        <img
                          src={IPFS_GATEWAY(h.photoCid)}
                          alt={`Ảnh bằng chứng bước ${STATUS_META[h.status]?.label || h.status}`}
                          className="mt-2.5 w-40 h-28 object-cover rounded-sm border border-rule"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </Card>
            </div>

            {/* Cột phải: QR + map */}
            <div className="flex flex-col gap-6">
              <Card className="p-5 text-center">
                <h2 className="font-display font-semibold text-ink mb-4 text-left">Mã QR tra cứu</h2>
                <div className="inline-block bg-paper2 border border-rule rounded-none p-3.5 mb-3">
                  <QRCodeSVG value={lookupUrl} size={150} />
                </div>
                <div className="font-mono text-[11px] text-inksoft break-all">{lookupUrl}</div>
                <p className="text-xs text-inksoft mt-2">In lên bao bì — người mua quét là xem được hành trình.</p>
              </Card>

              <Card className="p-5">
                <h2 className="font-display font-semibold text-ink mb-4">Bản đồ hành trình</h2>
                <MapView height={280} points={mapPoints} />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
