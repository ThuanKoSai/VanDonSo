/**
 * Con dấu xác thực — motif nhận diện đặc trưng của Vận đơn số: vòng răng
 * cưa (viền đứt), xoay -6° như dấu mộc đóng tay lên nhãn kiện hàng xuất khẩu.
 * tone="dark" (mặc định): mực forest trên nền giấy — dùng trên nền sáng.
 * tone="light": mực cream — dùng trên nền forest đậm.
 */
export default function VerificationStamp({ size = 120, label = "ĐÃ XÁC THỰC", tone = "dark" }) {
  const color = tone === "light" ? "border-cream text-cream" : "border-forest text-forest";
  return (
    <div
      className={"relative flex flex-col items-center justify-center rounded-full border-[3px] border-dashed -rotate-6 select-none " + color}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      <div className={"absolute rounded-full border " + color} style={{ inset: size * 0.07 }} aria-hidden="true" />
      <svg viewBox="0 0 24 24" width={size * 0.3} height={size * 0.3} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
        <path d="M4 12.5l5 5L20 6.5" />
      </svg>
      <span className="font-medium tracking-[0.18em] mt-1" style={{ fontSize: Math.max(8, size * 0.075) }}>
        {label}
      </span>
    </div>
  );
}
