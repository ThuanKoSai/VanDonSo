import { useEffect, useState } from "react";
import { Copy, LogOut, Wallet, Info, ShieldCheck } from "lucide-react";
import { Card, PageHeader, SkeletonRows } from "../components/Bits";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL, FOCUS_RING } from "../lib/ui";

const ROLE_LABEL = {
  admin: "Quản trị viên",
  producer: "Nhà sản xuất",
  transporter: "Đơn vị vận chuyển",
  distributor: "Nhà phân phối",
};

export default function ProfilePage() {
  const { wallet, connect, connecting } = useWallet();
  const { showToast } = useToast();
  const [roles, setRoles] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!wallet) { setRoles(null); setInfo(null); return; }
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/overview/roles/${wallet.address}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRoles(d.roles || []); })
      .catch(() => { if (!cancelled) setRoles([]); });
    fetch(`${API_BASE_URL}/api/overview/users/${wallet.address}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setInfo(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [wallet]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(wallet.address);
      showToast("Đã sao chép địa chỉ ví", "success");
    } catch {
      showToast("Không sao chép được — hãy copy thủ công", "error");
    }
  }

  async function disconnect() {
    // Thu hồi quyền của site trong MetaMask (nếu ví hỗ trợ), rồi tải lại trang.
    try {
      await window.ethereum?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch { /* một số ví chưa hỗ trợ — bỏ qua */ }
    window.location.reload();
  }

  if (!wallet) {
    return (
      <div className="max-w-md">
        <PageHeader title="Hồ sơ" />
        <Card className="p-8 text-center">
          <Wallet size={32} className="mx-auto text-rule mb-3" />
          <p className="text-sm text-inksoft mb-4">Kết nối ví để xem hồ sơ và vai trò của bạn.</p>
          <button onClick={connect} disabled={connecting}
            className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-5 py-2.5 disabled:opacity-60 " + FOCUS_RING}>
            {connecting ? "Đang kết nối..." : "Kết nối MetaMask"}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Hồ sơ" desc="Danh tính của bạn trong hệ thống là địa chỉ ví" />

      <div className="flex flex-col gap-5">
        <Card className="p-6 flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-cream text-forest text-lg font-bold flex items-center justify-center shrink-0">
            {wallet.address.slice(2, 4).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-display font-semibold text-ink">{info?.name || "Chưa đặt tên hiển thị"}</div>
            {roles === null ? (
              <div className="mt-1"><SkeletonRows count={1} height="h-5" /></div>
            ) : roles.length ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {roles.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 text-xs font-medium text-forest bg-cream rounded-full px-2.5 py-1">
                    <ShieldCheck size={12} /> {ROLE_LABEL[r] || r}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-inksoft mt-1">Chưa được cấp vai trò — liên hệ Admin để tham gia chuỗi cung ứng.</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display font-semibold text-ink mb-3">Địa chỉ ví</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs text-ink bg-paper border border-rule rounded-sm p-3 break-all">
              {wallet.address}
            </code>
            <button onClick={copyAddress} aria-label="Sao chép địa chỉ"
              className={"p-2.5 text-inksoft hover:text-forest bg-paper border border-rule rounded-sm " + FOCUS_RING}>
              <Copy size={16} />
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex gap-2.5 text-xs text-inksoft leading-relaxed mb-5">
            <Info size={15} className="text-forest shrink-0 mt-0.5" />
            <span>
              Hệ thống không có mật khẩu để "đổi": quyền truy cập của bạn chính là private key
              trong MetaMask. Muốn bảo vệ tài khoản — hãy bảo vệ cụm từ khôi phục của ví.
            </span>
          </div>
          <button onClick={disconnect}
            className={"flex items-center gap-2 text-sm font-medium text-crimson bg-cream hover:bg-crimson/10 rounded-sm px-4 py-2.5 " + FOCUS_RING}>
            <LogOut size={16} /> Ngắt kết nối ví
          </button>
        </Card>
      </div>
    </div>
  );
}
