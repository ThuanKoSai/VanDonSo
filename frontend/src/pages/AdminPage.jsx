import { useEffect, useMemo, useState } from "react";
import { id as roleId, isAddress } from "ethers";
import { ShieldCheck, Plus, Users } from "lucide-react";
import { Card, PageHeader, SkeletonRows, EmptyState } from "../components/Bits";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getContractWithSigner } from "../lib/contract";
import { API_BASE_URL, FOCUS_RING, formatTime } from "../lib/ui";

const ADMIN_MESSAGE = "Xac thuc Admin - Van don so";
const ROLE_OPTIONS = [
  { value: "producer", label: "Producer" },
  { value: "transporter", label: "Transporter" },
  { value: "distributor", label: "Distributor" },
];
// Hash vai trò tính cục bộ bằng keccak256 — khớp với constant trong contract
const ROLE_HASH = {
  producer: roleId("PRODUCER_ROLE"),
  transporter: roleId("TRANSPORTER_ROLE"),
  distributor: roleId("DISTRIBUTOR_ROLE"),
};
const PAGE_SIZE = 6;

export default function AdminPage() {
  const { wallet, connect } = useWallet();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ address: "", role: "producer", name: "" });
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {
      showToast("Không tải được danh sách tài khoản.", "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadUsers(); /* eslint-disable-next-line */ }, []);

  /** Cấp quyền: ghi on-chain trước (nguồn sự thật), rồi lưu metadata off-chain kèm chữ ký Admin. */
  async function handleGrant() {
    if (!wallet) return showToast("Kết nối ví Admin trước.", "error");
    if (!isAddress(form.address)) return showToast("Địa chỉ ví không hợp lệ.", "error");

    setBusy(true);
    try {
      const contract = getContractWithSigner(wallet.signer);
      await (await contract.grantRole(ROLE_HASH[form.role], form.address)).wait();

      const signature = await wallet.signer.signMessage(ADMIN_MESSAGE);
      await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": wallet.address,
          "x-wallet-signature": signature,
        },
        body: JSON.stringify({ walletAddress: form.address, role: form.role, name: form.name }),
      });

      showToast(`Đã cấp quyền ${form.role} thành công!`, "success");
      setForm({ address: "", role: "producer", name: "" });
      loadUsers();
    } catch (err) {
      showToast(err.reason || err.message || "Cấp quyền thất bại.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRole(u, grant) {
    if (!wallet) return showToast("Kết nối ví Admin trước.", "error");
    if (!ROLE_HASH[u.role]) return; // không thao tác vai trò admin qua UI này
    setBusy(true);
    try {
      const contract = getContractWithSigner(wallet.signer);
      const fn = grant ? "grantRole" : "revokeRole";
      await (await contract[fn](ROLE_HASH[u.role], u.walletAddress)).wait();
      setUsers((prev) => prev.map((x) => (x.walletAddress === u.walletAddress ? { ...x, isActive: grant } : x)));
      showToast(grant ? "Đã cấp lại quyền." : "Đã thu hồi quyền on-chain.", "success");
    } catch (err) {
      showToast(err.reason || err.message || "Thao tác thất bại.", "error");
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    let out = users;
    const key = q.trim().toLowerCase();
    if (key) out = out.filter((u) => u.walletAddress?.toLowerCase().includes(key) || u.name?.toLowerCase().includes(key));
    if (roleFilter !== "all") out = out.filter((u) => u.role === roleFilter);
    return out;
  }, [users, q, roleFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (page > pages) setPage(1); }, [pages, page]);

  return (
    <div>
      <PageHeader title="Quản trị" desc="Cấp và thu hồi quyền cho các địa chỉ ví — quyền hạn thực thi on-chain" />

      {!wallet && (
        <button onClick={connect} className={"mb-5 text-sm font-medium text-forest bg-cream hover:bg-cream rounded-sm px-4 py-2.5 " + FOCUS_RING}>
          Kết nối ví Admin để thao tác
        </button>
      )}

      {/* Form cấp quyền */}
      <Card className="p-5 mb-6">
        <h2 className="font-display font-semibold text-ink mb-4 flex items-center gap-2"><Plus size={17} /> Cấp quyền mới</h2>
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2.5">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="0x... địa chỉ ví"
            className={"px-3.5 py-2.5 text-sm bg-paper2 border border-rule rounded-sm font-mono " + FOCUS_RING}
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tên hiển thị (tùy chọn)"
            className={"px-3.5 py-2.5 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={"px-3 py-2.5 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING}
          >
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={handleGrant} disabled={busy}
            className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-5 py-2.5 disabled:opacity-60 " + FOCUS_RING}>
            {busy ? "Đang xử lý..." : "Cấp quyền"}
          </button>
        </div>
        <p className="mt-2.5 text-xs text-inksoft">
          Giao dịch grantRole được ký bằng ví Admin; metadata off-chain xác thực bằng chữ ký điện tử — không dùng mật khẩu.
        </p>
      </Card>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo địa chỉ ví hoặc tên..."
          className={"flex-1 min-w-[220px] px-3.5 py-2 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className={"px-3 py-2 text-sm bg-paper2 border border-rule rounded-sm " + FOCUS_RING}>
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="p-5"><SkeletonRows count={5} /></div>
        ) : !pageItems.length ? (
          <EmptyState icon={Users} title="Không có tài khoản phù hợp" desc="Cấp quyền cho địa chỉ ví đầu tiên ở form phía trên" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-inksoft border-b border-rule">
                <th className="px-5 py-3 font-medium">Địa chỉ</th>
                <th className="px-3 py-3 font-medium">Vai trò</th>
                <th className="px-3 py-3 font-medium hidden md:table-cell">Ngày cấp</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {pageItems.map((u) => (
                <tr key={u.walletAddress} className="hover:bg-paper">
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-xs text-ink">{u.walletAddress?.slice(0, 10)}...{u.walletAddress?.slice(-6)}</div>
                    {u.name && <div className="text-xs text-inksoft">{u.name}</div>}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-forest bg-cream rounded-full px-2.5 py-1">
                      <ShieldCheck size={12} /> {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-inksoft hidden md:table-cell">{u.createdAt ? formatTime(u.createdAt) : "—"}</td>
                  <td className="px-3 py-3.5">
                    <span className={"inline-flex items-center gap-1.5 text-xs " + (u.isActive ? "text-forest" : "text-inksoft")}>
                      <span className={"w-1.5 h-1.5 rounded-full " + (u.isActive ? "bg-forest" : "bg-rule")} aria-hidden="true" />
                      {u.isActive ? "Hoạt động" : "Đã thu hồi"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    {ROLE_HASH[u.role] ? (
                      u.isActive ? (
                        <button onClick={() => toggleRole(u, false)} disabled={busy}
                          className={"text-xs font-medium text-crimson hover:underline disabled:opacity-50 " + FOCUS_RING}>
                          Thu hồi
                        </button>
                      ) : (
                        <button onClick={() => toggleRole(u, true)} disabled={busy}
                          className={"text-xs font-medium text-forest hover:underline disabled:opacity-50 " + FOCUS_RING}>
                          Cấp lại
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-rule">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-rule text-sm">
            <span className="text-xs text-inksoft">Trang {page}/{pages} · {filtered.length} địa chỉ</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className={"px-3 py-1.5 text-xs font-medium text-inksoft bg-paper2 border border-rule rounded-sm disabled:opacity-40 " + FOCUS_RING}>
                Trước
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className={"px-3 py-1.5 text-xs font-medium text-inksoft bg-paper2 border border-rule rounded-sm disabled:opacity-40 " + FOCUS_RING}>
                Sau
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
