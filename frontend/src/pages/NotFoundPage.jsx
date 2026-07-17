import { Link } from "react-router-dom";
import { PackageX } from "lucide-react";
import { FOCUS_RING } from "../lib/ui";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 text-center">
      <PackageX size={44} className="text-rule mb-4" />
      <h1 className="font-display text-2xl font-bold text-ink mb-1">404 — Không tìm thấy trang</h1>
      <p className="text-sm text-inksoft mb-6">Đường dẫn này không tồn tại hoặc đã bị di chuyển.</p>
      <div className="flex gap-2.5">
        <Link to="/" className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-5 py-2.5 " + FOCUS_RING}>
          Về trang chủ
        </Link>
        <Link to="/lookup" className={"text-sm font-medium text-ink bg-paper2 border border-rule hover:bg-paper rounded-sm px-5 py-2.5 " + FOCUS_RING}>
          Tra cứu lô hàng
        </Link>
      </div>
    </div>
  );
}
