import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Boxes, Wallet, Info, Search } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { FOCUS_RING, API_BASE_URL } from "../lib/ui";

/**
 * "Đăng nhập" trong hệ thống này = kết nối ví. KHÔNG có email/mật khẩu —
 * đây là quyết định thiết kế có chủ đích: danh tính duy nhất là địa chỉ
 * ví, quyền hạn nằm on-chain (AccessControl), backend xác thực Admin bằng
 * chữ ký điện tử. Thêm mật khẩu là thêm một hệ thống danh tính song song
 * mâu thuẫn với chính đề tài.
 */
export default function LoginPage() {
  const { wallet, connect, connecting, error } = useWallet();
  const navigate = useNavigate();
  const [roles, setRoles] = useState(null);

  // Sau khi ví kết nối: tra vai trò on-chain rồi vào Dashboard
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/overview/roles/${wallet.address}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRoles(data.roles || []);
        setTimeout(() => navigate("/dashboard"), 600);
      })
      .catch(() => {
        if (!cancelled) navigate("/dashboard");
      });
    return () => { cancelled = true; };
  }, [wallet, navigate]);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-10">
      <Link to="/" className={"flex items-center gap-2.5 font-bold text-ink mb-8 " + FOCUS_RING}>
        <span className="w-10 h-10 rounded-sm bg-forest text-cream flex items-center justify-center"><Boxes size={22} /></span>
        Vận đơn số
      </Link>

      <div className="w-full max-w-md bg-paper2 border border-rule rounded-none shadow-none p-8">
        <h1 className="font-display text-xl font-bold text-ink mb-1">Đăng nhập</h1>
        <p className="text-sm text-inksoft mb-6">Dành cho Producer, Transporter, Distributor và Admin.</p>

        <button
          onClick={connect}
          disabled={connecting || !!wallet}
          className={"w-full flex items-center justify-center gap-2.5 py-3 rounded-sm bg-forest hover:bg-forestD text-cream font-medium disabled:opacity-60 " + FOCUS_RING}
        >
          <Wallet size={18} />
          {wallet ? "Đã kết nối — đang vào hệ thống..." : connecting ? "Đang kết nối..." : "Kết nối MetaMask"}
        </button>

        {error && <div className="mt-3 text-sm text-crimson" role="alert">{error}</div>}

        {wallet && (
          <div className="mt-4 text-sm text-inksoft">
            <span className="font-mono">{wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}</span>
            {roles && (
              <span className="ml-2 text-forest font-medium">
                {roles.length ? `Vai trò: ${roles.join(", ")}` : "Chưa được cấp vai trò — liên hệ Admin"}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2.5 text-xs text-inksoft bg-cream border border-rule rounded-sm p-3.5 leading-relaxed">
          <Info size={15} className="text-forest shrink-0 mt-0.5" />
          <span>
            Hệ thống không dùng email/mật khẩu: danh tính của bạn là địa chỉ ví, quyền hạn được
            ghi trên blockchain. Không ai — kể cả quản trị viên — có thể đăng nhập thay bạn nếu
            không có private key trong ví của bạn.
          </span>
        </div>
      </div>

      <Link to="/lookup" className={"mt-6 flex items-center gap-1.5 text-sm text-inksoft hover:text-ink " + FOCUS_RING}>
        <Search size={15} /> Người tiêu dùng: tra cứu công khai, không cần đăng nhập
      </Link>
    </div>
  );
}
