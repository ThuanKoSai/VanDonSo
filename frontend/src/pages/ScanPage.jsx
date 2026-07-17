import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { ScanLine } from "lucide-react";
import { Card, PageHeader } from "../components/Bits";
import { FOCUS_RING } from "../lib/ui";

/**
 * Quét QR toàn khung hình bằng camera: vẽ từng frame video lên canvas ẩn,
 * giải mã bằng jsQR. Nhận cả URL /lookup/:id lẫn mã số thuần.
 */
export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [manual, setManual] = useState("");

  function resolve(text) {
    const m = String(text).match(/\/lookup\/(\d+)/) || String(text).trim().match(/^#?(\d+)$/);
    if (m) {
      navigate(`/lookup/${m[1]}`);
      return true;
    }
    setError("Mã QR này không thuộc hệ thống Vận đơn số.");
    return false;
  }

  useEffect(() => {
    let stream, raf, active = true;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      } catch {
        setError("Không mở được camera — kiểm tra quyền truy cập (camera chỉ hoạt động trên localhost hoặc HTTPS).");
      }
    }

    function tick() {
      if (!active) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c && v.readyState === 4) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(v, 0, 0);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(img.data, img.width, img.height);
        if (code?.data && resolve(code.data)) return; // đã điều hướng — dừng vòng lặp
      }
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl">
      <PageHeader title="Quét mã QR" desc="Hướng camera vào mã QR trên bao bì lô hàng" />

      <Card className="overflow-hidden">
        <div className="relative bg-forestD aspect-[4/3]">
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          {/* Khung ngắm */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 border-2 border-cream/70 rounded-none relative">
              <ScanLine size={26} className="absolute -top-9 left-1/2 -translate-x-1/2 text-cream/80" />
            </div>
          </div>
        </div>

        <div className="p-5">
          {error && <div className="text-sm text-crimson mb-3" role="alert">{error}</div>}
          <div className="text-xs text-inksoft mb-2">Hoặc nhập mã lô thủ công:</div>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manual.trim() && resolve(manual)}
              placeholder="VD: 24"
              className={"flex-1 px-3.5 py-2 text-sm bg-paper border border-rule rounded-sm font-mono " + FOCUS_RING}
            />
            <button
              onClick={() => manual.trim() && resolve(manual)}
              className={"text-sm font-medium text-cream bg-forest hover:bg-forestD rounded-sm px-4 " + FOCUS_RING}
            >
              Tra cứu
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
