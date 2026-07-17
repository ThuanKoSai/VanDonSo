import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ScanLine, Blocks, User, ShieldCheck,
  Search, Boxes, Menu, X, Globe,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { FOCUS_RING } from "../lib/ui";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shipments", label: "Lô hàng", icon: Package },
  { to: "/scan", label: "Quét QR", icon: ScanLine },
  { to: "/transactions", label: "Lịch sử Blockchain", icon: Blocks },
  { to: "/profile", label: "Hồ sơ", icon: User },
  { to: "/admin", label: "Quản trị", icon: ShieldCheck },
];

function SideNav({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors " +
            (isActive ? "bg-cream text-forest" : "text-inksoft hover:bg-paper hover:text-ink") +
            " " + FOCUS_RING
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppShell() {
  const { wallet, connect, connecting } = useWallet();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  function submitSearch(e) {
    if (e.key === "Enter" && q.trim()) navigate(`/shipments?q=${encodeURIComponent(q.trim())}`);
  }

  const logo = (
    <Link to="/dashboard" className={"flex items-center gap-2.5 px-4 " + FOCUS_RING}>
      <span className="w-9 h-9 rounded-sm bg-forest text-cream flex items-center justify-center">
        <Boxes size={20} />
      </span>
      <span className="font-bold text-ink">Vận đơn số</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-paper2 border-r border-rule py-5 gap-6">
        {logo}
        <SideNav />
        <div className="mt-auto px-3">
          <Link
            to="/"
            className={"flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-inksoft hover:bg-paper " + FOCUS_RING}
          >
            <Globe size={18} /> Trang giới thiệu
          </Link>
        </div>
      </aside>

      {/* Sidebar mobile (overlay) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-paper2 py-5 flex flex-col gap-6 ">
            <div className="flex items-center justify-between pr-3">
              {logo}
              <button onClick={() => setMobileOpen(false)} aria-label="Đóng menu" className={"p-2 text-inksoft " + FOCUS_RING}>
                <X size={20} />
              </button>
            </div>
            <SideNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Vùng nội dung */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-rule h-16 flex items-center gap-3 px-4 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            className={"lg:hidden p-2 text-inksoft " + FOCUS_RING}
          >
            <Menu size={20} />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-inksoft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={submitSearch}
              placeholder="Tìm lô hàng theo tên hoặc mã..."
              className={"w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-sm " + FOCUS_RING}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {wallet ? (
              <span className="flex items-center gap-2 text-sm font-mono text-ink bg-paper border border-rule rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-forest" aria-hidden="true" />
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-4 py-2 disabled:opacity-60 " + FOCUS_RING}
              >
                {connecting ? "Đang kết nối..." : "Kết nối ví"}
              </button>
            )}
            <Link
              to="/profile"
              aria-label="Hồ sơ"
              className={"w-9 h-9 rounded-full bg-cream text-forest text-xs font-bold flex items-center justify-center " + FOCUS_RING}
            >
              {wallet ? wallet.address.slice(2, 4).toUpperCase() : "?"}
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
