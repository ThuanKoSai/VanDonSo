import { useEffect, useState } from "react";
import { Blocks, ExternalLink, Info } from "lucide-react";
import { Card, SkeletonRows, EmptyState, PageHeader } from "../components/Bits";
import { API_BASE_URL, FOCUS_RING, formatTime, shortenHash, EXPLORER_TX } from "../lib/ui";

/** Lịch sử giao dịch blockchain của toàn hệ thống — đọc từ event log của contract. */
export default function TransactionsPage() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/overview/transactions?limit=25`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (!cancelled) setTxs(data); })
      .catch(() => { if (!cancelled) setError("Không tải được lịch sử giao dịch."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <PageHeader title="Lịch sử Blockchain" desc="Toàn bộ giao dịch của contract, mới nhất trước" />

      <div className="flex gap-2.5 text-xs text-inksoft bg-cream border border-rule rounded-sm p-3.5 mb-4 leading-relaxed max-w-2xl">
        <Info size={15} className="text-forest shrink-0 mt-0.5" />
        <span>Nút "Etherscan" chỉ hoạt động khi hệ thống chạy trên Sepolia — mạng Hardhat local không có block explorer công khai.</span>
      </div>

      <Card>
        {error && <div className="p-4 text-sm text-crimson">{error}</div>}
        {loading ? (
          <div className="p-5"><SkeletonRows count={6} height="h-10" /></div>
        ) : !txs.length ? (
          <EmptyState icon={Blocks} title="Chưa có giao dịch nào" desc="Tạo lô hàng đầu tiên để thấy giao dịch ở đây" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-inksoft border-b border-rule">
                <th className="px-5 py-3 font-medium">Tx Hash</th>
                <th className="px-3 py-3 font-medium">Loại</th>
                <th className="px-3 py-3 font-medium hidden sm:table-cell">Block</th>
                <th className="px-3 py-3 font-medium hidden md:table-cell">Gas</th>
                <th className="px-3 py-3 font-medium hidden sm:table-cell">Thời gian</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {txs.map((t) => (
                <tr key={t.txHash} className="hover:bg-paper">
                  <td className="px-5 py-3 font-mono text-xs text-ink">{shortenHash(t.txHash)}</td>
                  <td className="px-3 py-3 text-ink">
                    {t.type} <span className="text-inksoft">· Lô #{t.batchId}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-inksoft hidden sm:table-cell">{t.blockNumber}</td>
                  <td className="px-3 py-3 font-mono text-xs text-inksoft hidden md:table-cell">
                    {t.gasUsed ? t.gasUsed.toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-inksoft hidden sm:table-cell">{formatTime(t.timestamp)}</td>
                  <td className="px-3 py-3 text-right">
                    <a href={EXPLORER_TX(t.txHash)} target="_blank" rel="noreferrer"
                      className={"inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline " + FOCUS_RING}>
                      Etherscan <ExternalLink size={11} />
                    </a>
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
