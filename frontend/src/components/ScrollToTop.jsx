import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router mặc định KHÔNG tự cuộn về đầu trang khi chuyển route
 * (khác với website truyền thống). Component này fix lỗi UX kinh điển đó —
 * đặt trong App.jsx, không render gì cả, chỉ theo dõi pathname.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
