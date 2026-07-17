import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Plus, QrCode, ChevronRight } from "lucide-react";
import { Card, StatusBadge, SkeletonRows, EmptyState, PageHeader } from "../components/Bits";
import { API_BASE_URL, FOCUS_RING, formatTime, STATUS_META } from "../lib/ui";

export default function ShipmentsPage() {
  const [searchParams] = useSearchParams();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => setQ(searchParams.get("q") || ""), [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/overview/batches`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (!cancelled) setBatches(data); })
      .catch(() => { if (!cancelled) setError("Không tải được danh sách lô hàng."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let out = batches;
    const key = q.trim().toLowerCase();
    if (key) {
      out = out.filter(
        (b) => b.productName?.toLowerCase().includes(key) || String(b.batchId) === key.replace("#", "")
      );
    }
    if (status !== "all") out = out.filter((b) => b.currentStatus === status);
    out = [...out].sort((a, b) =>
      sort === "newest" ? b.batchId - a.batchId : a.batchId - b.batchId
    );
    return out;
  }, [batches, q, status, sort]);

  return (
    <div>
      <PageHeader title="Lô hàng" desc={`${batches.length} lô hàng trên blockchain`}>
        <Link to="/shipments/new" className={"flex items-center gap-1.5 text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-4 py-2 " + FOCUS_RING}>
          <Plus size={16} /> Tạo lô hàng
        </Link>
      </PageHeader>

      {/* Thanh công cụ */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc mã lô..."
          className={"flex-1 min-w-[200px] px-3.5 py-2 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className={"px-3 py-2 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className={"px-3 py-2 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING}>
          <option value="newest">Mới nhất trước</option>
          <option value="oldest">Cũ nhất trước</option>
        </select>
      </div>

      <Card>
        {error && <div className="p-4 text-sm text-crimson">{error}</div>}
        {loading ? (
          <div className="p-5"><SkeletonRows count={5} /></div>
        ) : !filtered.length ? (
          <EmptyState icon={Package} title="Không có lô hàng phù hợp" desc="Thử đổi từ khóa hoặc bộ lọc" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-inksoft border-b border-rule">
                <th className="px-5 py-3 font-medium">Mã</th>
                <th className="px-3 py-3 font-medium">Tên sản phẩm</th>
                <th className="px-3 py-3 font-medium hidden md:table-cell">QR</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
                <th className="px-3 py-3 font-medium hidden sm:table-cell">Ngày tạo</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filtered.map((b) => (
                <tr key={b.batchId} className="hover:bg-paper">
                  <td className="px-5 py-3.5 font-mono text-xs text-inksoft">#{b.batchId}</td>
                  <td className="px-3 py-3.5 font-medium text-ink">
                    <Link to={`/shipments/${b.batchId}`} className={FOCUS_RING}>{b.productName}</Link>
                    <div className="text-xs text-inksoft font-normal truncate max-w-[260px]">{b.declaredAddress}</div>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <Link to={`/shipments/${b.batchId}`} aria-label={`Xem QR lô ${b.batchId}`} className={"inline-flex text-inksoft hover:text-forest " + FOCUS_RING}>
                      <QrCode size={18} />
                    </Link>
                  </td>
                  <td className="px-3 py-3.5"><StatusBadge status={b.currentStatus} /></td>
                  <td className="px-3 py-3.5 text-xs text-inksoft hidden sm:table-cell">{formatTime(b.createdAt)}</td>
                  <td className="px-3 py-3.5 text-right">
                    <Link to={`/shipments/${b.batchId}`} className={"inline-flex items-center gap-0.5 text-forest text-xs font-medium hover:underline " + FOCUS_RING}>
                      Chi tiết <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
