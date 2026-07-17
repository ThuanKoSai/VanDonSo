import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle2, Percent, ExternalLink, Blocks, RefreshCw } from "lucide-react";
import { Card, StatCard, StatusBadge, SkeletonRows, EmptyState, PageHeader } from "../components/Bits";
import MapView from "../components/MapView";
import { API_BASE_URL, FOCUS_RING, formatTime, shortenHash, EXPLORER_TX } from "../lib/ui";

const NETWORK_NAME = { 11155111: "Ethereum Sepolia", 31337: "Hardhat Local", 1: "Ethereum Mainnet" };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/overview/stats`);
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      setError("Không tải được dữ liệu thống kê — kiểm tra backend và RPC đang chạy.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const delivered = stats?.counts?.Delivered || 0;
  const total = stats?.totalBatches || 0;
  const pct = total ? Math.round((delivered / total) * 100) : 0;

  return (
    <div>
      <PageHeader title="Dashboard" desc="Tổng quan hệ thống truy xuất nguồn gốc">
        <button onClick={load} className={"flex items-center gap-1.5 text-sm text-inksoft bg-paper2 border border-rule rounded-sm px-3.5 py-2 hover:bg-paper " + FOCUS_RING}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </PageHeader>

      {error && (
        <Card className="p-4 mb-6 border-crimson/40 bg-cream text-sm text-crimson">{error}</Card>
      )}

      {/* 4 thẻ số liệu */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} label="Tổng số lô hàng" value={loading ? "…" : total} tone="text-forest bg-cream" />
        <StatCard icon={Truck} label="Đang vận chuyển" value={loading ? "…" : stats?.counts?.InTransit ?? 0} tone="text-goldtext bg-cream" />
        <StatCard icon={CheckCircle2} label="Đã giao" value={loading ? "…" : delivered} tone="text-forest bg-cream" />
        <StatCard icon={Percent} label="Tỷ lệ hoàn tất" value={loading ? "…" : `${pct}%`} sub="Delivered / tổng lô" tone="text-goldtext bg-cream" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cột trái 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Lô hàng gần đây</h2>
              <Link to="/shipments" className={"text-sm text-forest hover:underline " + FOCUS_RING}>Xem tất cả</Link>
            </div>
            {loading ? <SkeletonRows count={4} /> : !stats?.recentBatches?.length ? (
              <EmptyState icon={Package} title="Chưa có lô hàng nào" desc="Tạo lô hàng đầu tiên ở mục Lô hàng" />
            ) : (
              <div className="divide-y divide-rule">
                {stats.recentBatches.map((b) => (
                  <Link key={b.batchId} to={`/shipments/${b.batchId}`} className={"flex items-center gap-3 py-3 hover:bg-paper rounded-sm px-2 -mx-2 " + FOCUS_RING}>
                    <span className="font-mono text-xs text-inksoft w-10">#{b.batchId}</span>
                    <span className="text-sm font-medium text-ink flex-1 truncate">{b.productName}</span>
                    <StatusBadge status={b.currentStatus} />
                    <span className="hidden sm:block text-xs text-inksoft w-32 text-right">{formatTime(b.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Giao dịch gần đây</h2>
              <Link to="/transactions" className={"text-sm text-forest hover:underline " + FOCUS_RING}>Xem tất cả</Link>
            </div>
            {loading ? <SkeletonRows count={3} height="h-10" /> : !stats?.recentTransactions?.length ? (
              <EmptyState icon={Blocks} title="Chưa có giao dịch nào" />
            ) : (
              <div className="divide-y divide-rule text-sm">
                {stats.recentTransactions.map((t) => (
                  <div key={t.txHash} className="flex items-center gap-3 py-2.5">
                    <a href={EXPLORER_TX(t.txHash)} target="_blank" rel="noreferrer" className={"font-mono text-xs text-forest hover:underline " + FOCUS_RING}>
                      {shortenHash(t.txHash)}
                    </a>
                    <span className="text-inksoft flex-1 truncate">{t.type} · Lô #{t.batchId}</span>
                    <span className="text-xs text-inksoft">{formatTime(t.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Cột phải 1/3 */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-display font-semibold text-ink mb-4">Trạng thái Blockchain</h2>
            {loading ? <SkeletonRows count={3} height="h-8" /> : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-inksoft">Mạng</dt>
                  <dd className="font-medium text-ink">{NETWORK_NAME[stats?.network?.chainId] || `Chain ${stats?.network?.chainId ?? "?"}`}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-inksoft">Block mới nhất</dt>
                  <dd className="font-mono text-ink">{stats?.network?.blockNumber ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-inksoft mb-1">Contract</dt>
                  <dd className="font-mono text-xs text-ink break-all bg-paper rounded-sm p-2.5 flex items-start gap-1.5">
                    {stats?.network?.contractAddress || "—"}
                    {stats?.network?.contractAddress && (
                      <a
                        href={`https://sepolia.etherscan.io/address/${stats.network.contractAddress}`}
                        target="_blank" rel="noreferrer" aria-label="Xem contract trên Etherscan"
                        className={"text-forest shrink-0 " + FOCUS_RING}
                      ><ExternalLink size={13} /></a>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-display font-semibold text-ink mb-4">Điểm xuất phát các lô gần đây</h2>
            <MapView
              height={260}
              points={(stats?.recentBatches || []).map((b) => ({ lat: b.refLat, lng: b.refLng, label: `#${b.batchId} ${b.productName}` }))}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
