import { BrowserProvider } from "ethers";

/**
 * Kết nối MetaMask — chạy TRỰC TIẾP trên trình duyệt người dùng.
 * Đây là điểm mấu chốt của kiến trúc hybrid: người dùng tự ký giao dịch
 * bằng ví của họ, backend không bao giờ giữ private key để ký thay.
 *
 * @returns {Promise<{provider, signer, address, chainId}>}
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error(
      "Chưa cài đặt MetaMask. Vui lòng cài extension MetaMask rồi tải lại trang."
    );
  }

  const provider = new BrowserProvider(window.ethereum);

  // Yêu cầu người dùng cấp quyền kết nối (hiện popup MetaMask)
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  // Cho phép 2 mạng: Sepolia (deploy thật) và Hardhat Local (test nhanh,
  // miễn phí, dùng khi phát triển/demo trước khi deploy Sepolia thật).
  const SEPOLIA_CHAIN_ID = 11155111n;
  const HARDHAT_LOCAL_CHAIN_ID = 31337n;
  const ALLOWED_CHAINS = [SEPOLIA_CHAIN_ID, HARDHAT_LOCAL_CHAIN_ID];

  if (!ALLOWED_CHAINS.includes(network.chainId)) {
    throw new Error(
      `Sai mạng. Vui lòng chuyển MetaMask sang Sepolia Testnet hoặc Hardhat Local (hiện đang ở chainId ${network.chainId}).`
    );
  }

  return { provider, signer, address, chainId: network.chainId };
}

/**
 * Khôi phục kết nối IM LẶNG khi tải lại trang (F5): dùng `eth_accounts`
 * thay vì `eth_requestAccounts` — lời gọi này KHÔNG hiện popup, chỉ trả
 * về tài khoản nếu người dùng ĐÃ cấp quyền cho site từ trước.
 *
 * Fix lỗ hổng UX phát hiện khi audit: trước đây F5 là mất kết nối, phải
 * bấm "Kết nối ví" lại từ đầu dù MetaMask đã tin tưởng site này rồi.
 */
export async function restoreWalletSilently() {
  if (!window.ethereum) return null;

  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (!accounts || accounts.length === 0) return null;

  // Đã có quyền sẵn → connectWallet() sẽ resolve ngay, không hiện popup
  return connectWallet();
}

/**
 * Lắng nghe khi người dùng đổi tài khoản hoặc đổi mạng trong MetaMask,
 * để UI cập nhật lại trạng thái kết nối ngay lập tức.
 */
export function subscribeWalletEvents({ onAccountChange, onChainChange }) {
  if (!window.ethereum) return () => {};

  const handleAccounts = (accounts) => onAccountChange?.(accounts[0] ?? null);
  const handleChain = (chainId) => onChainChange?.(chainId);

  window.ethereum.on("accountsChanged", handleAccounts);
  window.ethereum.on("chainChanged", handleChain);

  // Trả về hàm dọn dẹp listener khi component unmount
  return () => {
    window.ethereum.removeListener("accountsChanged", handleAccounts);
    window.ethereum.removeListener("chainChanged", handleChain);
  };
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
