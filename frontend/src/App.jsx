import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import AppShell from "./components/AppShell";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import LookupPage from "./pages/LookupPage";
import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import ShipmentCreatePage from "./pages/ShipmentCreatePage";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import UpdateJourneyPage from "./pages/UpdateJourneyPage";
import ScanPage from "./pages/ScanPage";
import TransactionsPage from "./pages/TransactionsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * Cấu trúc route theo sitemap:
 * - Công khai (không sidebar): Landing, Đăng nhập, Tra cứu (đích của mã QR)
 * - Trong AppShell (sidebar + header): Dashboard, Lô hàng (danh sách/tạo/
 *   chi tiết/cập nhật hành trình), Quét QR, Lịch sử Blockchain, Hồ sơ, Quản trị
 */
export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/lookup" element={<LookupPage />} />
              <Route path="/lookup/:batchId" element={<LookupPage />} />

              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/shipments/new" element={<ShipmentCreatePage />} />
                <Route path="/shipments/:batchId" element={<ShipmentDetailPage />} />
                <Route path="/shipments/:batchId/update" element={<UpdateJourneyPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}
