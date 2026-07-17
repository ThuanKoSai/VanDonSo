import { Link } from "react-router-dom";
import {
  Boxes, ArrowRight, Database, MapPin, ShieldCheck, PackagePlus, Truck,
  Warehouse, ScanLine, CheckCircle2, Search,
} from "lucide-react";
import { FOCUS_RING } from "../lib/ui";
import VerificationStamp from "../components/VerificationStamp";

const INTRO = [
  { icon: Database, title: "Dữ liệu bất biến", desc: "Mọi mốc hành trình được ghi lên Ethereum — không ai sửa hay xóa được sau khi ghi, kể cả người vận hành hệ thống." },
  { icon: MapPin, title: "Proof of Location", desc: "Ảnh chụp trực tiếp + GPS thật + giờ máy chủ gộp thành một mã băm SHA-256 duy nhất trước khi lên chain." },
  { icon: ShieldCheck, title: "Tự kiểm chứng", desc: "Người tiêu dùng đối chiếu độc lập từng giao dịch trên Etherscan — không cần tin tưởng bên trung gian nào." },
];

const PROCESS = [
  { icon: PackagePlus, label: "Create", desc: "Producer khởi tạo lô hàng" },
  { icon: Truck, label: "Transport", desc: "Transporter xác nhận + PoL" },
  { icon: Warehouse, label: "Warehouse", desc: "Distributor nhập kho" },
  { icon: ScanLine, label: "Consumer", desc: "Người mua quét QR tra cứu" },
];

const ADVANTAGES = [
  "Chống sửa đổi dữ liệu hồi tố — audit log tập trung không làm được điều này",
  "Bằng chứng vị trí gắn với thời điểm thực, tăng mạnh chi phí gian lận",
  "Tra cứu công khai không cần tài khoản, không cần ví điện tử",
  "Phân quyền on-chain: mỗi vai trò chỉ ghi được đúng bước của mình",
];

const TECH = ["React 18", "Node.js / Express", "Solidity 0.8.20", "Ethereum Sepolia", "IPFS / Pinata", "MongoDB"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper2 text-ink">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-rule">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
          <Link to="/" className={"flex items-center gap-2.5 font-bold " + FOCUS_RING}>
            <span className="w-9 h-9 rounded-sm bg-forest text-cream flex items-center justify-center"><Boxes size={20} /></span>
            Vận đơn số
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-inksoft">
            <a href="#gioi-thieu" className={"hover:text-ink " + FOCUS_RING}>Giới thiệu</a>
            <a href="#quy-trinh" className={"hover:text-ink " + FOCUS_RING}>Quy trình</a>
            <a href="#cong-nghe" className={"hover:text-ink " + FOCUS_RING}>Công nghệ</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/lookup" className={"hidden sm:flex items-center gap-1.5 text-sm text-inksoft hover:text-ink " + FOCUS_RING}>
              <Search size={15} /> Tra cứu
            </Link>
            <Link to="/login" className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-4 py-2 " + FOCUS_RING}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-forest bg-cream rounded-full px-3 py-1 mb-5">
            Blockchain Supply Chain
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-5">
            Truy xuất nguồn gốc hàng hóa bằng Blockchain
          </h1>
          <p className="text-inksoft text-lg leading-relaxed mb-8 max-w-xl">
            Mỗi lô nông sản mang một hành trình được xác thực bằng ảnh chụp trực tiếp,
            tọa độ GPS thật và chữ ký số — ghi vĩnh viễn trên Ethereum, không thể sửa đổi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className={"inline-flex items-center gap-2 text-cream bg-forest hover:bg-forestD font-medium rounded-sm px-6 py-3 " + FOCUS_RING}>
              Bắt đầu <ArrowRight size={17} />
            </Link>
            <Link to="/lookup" className={"inline-flex items-center gap-2 text-ink bg-paper3 hover:bg-rule font-medium rounded-sm px-6 py-3 " + FOCUS_RING}>
              Tra cứu công khai
            </Link>
          </div>
        </div>
        <div className="bg-gradient-to-br from-forest to-forestD rounded-none p-8 text-cream ">
          <div className="mb-6 flex justify-center"><VerificationStamp size={120} tone="light" /></div>
          <div className="grid grid-cols-2 gap-6">
            <div><div className="text-3xl font-bold">4</div><div className="text-sm text-cream">Trạng thái hành trình</div></div>
            <div><div className="text-3xl font-bold">3</div><div className="text-sm text-cream">Yếu tố gộp thành hash</div></div>
            <div><div className="text-3xl font-bold">24</div><div className="text-sm text-cream">Test case tự động</div></div>
            <div><div className="text-3xl font-bold">0</div><div className="text-sm text-cream">Bên trung gian phải tin</div></div>
          </div>
          <div className="mt-8 pt-6 border-t border-cream/25 font-mono text-xs text-cream break-all">
            SHA-256( ảnh + GPS + giờ server ) → on-chain
          </div>
        </div>
      </section>

      {/* Giới thiệu */}
      <section id="gioi-thieu" className="bg-paper py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-center mb-10">Vì sao cần hệ thống này?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {INTRO.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-paper2 border border-rule rounded-none p-6">
                <span className="w-11 h-11 rounded-sm bg-cream text-forest flex items-center justify-center mb-4"><Icon size={22} /></span>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-inksoft leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quy trình */}
      <section id="quy-trinh" className="py-16 max-w-6xl mx-auto px-4">
        <h2 className="font-display text-2xl font-bold text-center mb-10">Quy trình 4 bước</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="relative bg-paper2 border border-rule rounded-none p-6 text-center">
              <span className="w-12 h-12 mx-auto rounded-full bg-forest text-cream flex items-center justify-center mb-3"><Icon size={22} /></span>
              <div className="text-xs font-semibold text-forest uppercase tracking-wider mb-1">Bước {i + 1}</div>
              <div className="font-semibold">{label}</div>
              <div className="text-xs text-inksoft mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ưu điểm + Công nghệ */}
      <section id="cong-nghe" className="bg-paper py-16">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Ưu điểm</h2>
            <ul className="space-y-3">
              {ADVANTAGES.map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-sm text-inksoft">
                  <CheckCircle2 size={17} className="text-forest shrink-0 mt-0.5" /> {a}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Công nghệ sử dụng</h2>
            <div className="flex flex-wrap gap-2.5">
              {TECH.map((t) => (
                <span key={t} className="text-sm font-medium bg-paper2 border border-rule rounded-sm px-4 py-2">{t}</span>
              ))}
            </div>
            <p className="text-sm text-inksoft mt-6 leading-relaxed">
              Kiến trúc lai: người dùng tự ký giao dịch bằng MetaMask (backend không giữ private key);
              tra cứu công khai qua backend đọc hộ hàm view — miễn phí gas, không cần ví.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forestD text-inksoft py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5 text-cream font-semibold">
            <span className="w-8 h-8 rounded-sm bg-forest flex items-center justify-center"><Boxes size={17} /></span>
            Vận đơn số
          </div>
          <div>Đồ án môn học · Truy xuất nguồn gốc chuỗi cung ứng bằng Blockchain · 2026</div>
        </div>
      </footer>
    </div>
  );
}
