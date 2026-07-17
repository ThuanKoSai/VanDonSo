import { Component } from "react";

/**
 * Bắt lỗi runtime ở bất kỳ component con nào — nếu 1 trang bị lỗi (VD:
 * dữ liệu backend trả về sai định dạng), chỉ hỏng đúng phần đó, KHÔNG
 * làm trắng toàn bộ app. Đây phải là class component — React chưa hỗ trợ
 * Error Boundary bằng hooks.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary bắt được lỗi:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-display font-display text-xl font-bold mb-3 text-crimson">Đã có lỗi xảy ra</h1>
          <p className="text-inksoft text-sm mb-6">
            Trang này gặp sự cố khi hiển thị. Vui lòng tải lại trang hoặc quay về trang chủ.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-5 py-2.5 border border-ink bg-forest text-paper text-xs uppercase tracking-wide font-medium"
          >
            Về trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
