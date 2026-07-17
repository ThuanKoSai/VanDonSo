import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  connectWallet as connectWalletLib,
  restoreWalletSilently,
  subscribeWalletEvents,
} from "../lib/wallet";

const WalletContext = createContext(null);

/**
 * Bọc toàn bộ app 1 lần duy nhất (xem App.jsx). Nhờ vậy, khi người dùng
 * chuyển từ trang Producer sang Transporter, KHÔNG cần kết nối lại MetaMask —
 * đây là fix cho lỗi "mỗi trang tự giữ state ví riêng" đã phát hiện khi audit.
 */
export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null); // { signer, address }
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { signer, address } = await connectWalletLib();
      setWallet({ signer, address });
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }, []);

  // Khôi phục kết nối IM LẶNG khi tải lại trang — nếu người dùng đã cấp
  // quyền từ trước thì tự nối lại, không hiện popup, không báo lỗi nếu
  // chưa từng kết nối (đó là trạng thái bình thường của khách mới).
  useEffect(() => {
    let cancelled = false;
    restoreWalletSilently()
      .then((res) => {
        if (res && !cancelled) setWallet({ signer: res.signer, address: res.address });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeWalletEvents({
      onAccountChange: (addr) => {
        if (!addr) setWallet(null); // người dùng disconnect trong MetaMask
      },
      onChainChange: () => {
        // Đơn giản hoá: bắt kết nối lại khi đổi mạng để tránh dùng nhầm signer cũ
        setWallet(null);
        setError("Bạn vừa đổi mạng trong MetaMask — vui lòng kết nối lại.");
      },
    });
    return unsubscribe;
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, connecting, error, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet() phải được gọi bên trong <WalletProvider>");
  return ctx;
}
