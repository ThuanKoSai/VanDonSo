/**
 * Lấy tọa độ GPS thật từ trình duyệt.
 * Yêu cầu HTTPS (hoặc localhost khi dev) và người dùng phải cấp quyền.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ Geolocation API."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // Dịch lỗi sang tiếng Việt dễ hiểu cho người dùng
        const messages = {
          1: "Bạn đã từ chối cấp quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.",
          2: "Không xác định được vị trí. Vui lòng thử lại ở khu vực có tín hiệu tốt hơn.",
          3: "Quá thời gian chờ lấy vị trí. Vui lòng thử lại.",
        };
        reject(new Error(messages[error.code] || "Lỗi không xác định khi lấy vị trí."));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Mở camera trực tiếp — KHÔNG cho phép chọn ảnh có sẵn từ thư viện,
 * đây là yêu cầu bắt buộc để Proof of Location có ý nghĩa chống giả mạo.
 */
export async function openCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Trình duyệt không hỗ trợ truy cập camera.");
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }, // ưu tiên camera sau trên điện thoại
  });
}

/** Chụp 1 khung hình từ <video> đang phát camera, trả về Blob ảnh JPEG */
export function captureFrame(videoEl) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext("2d").drawImage(videoEl, 0, 0);
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

/**
 * Lấy giờ hiện tại từ SERVER (không tin giờ máy client — chống giả mạo timestamp).
 * Backend cần có endpoint GET /api/server-time trả về { timestamp: <unix ms> }.
 */
export async function getServerTimestamp(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/api/server-time`);
  if (!res.ok) throw new Error("Không lấy được giờ máy chủ.");
  const data = await res.json();
  return data.timestamp;
}

/**
 * Hàm cốt lõi của Proof of Location: gộp (ảnh + tọa độ + timestamp)
 * thành MỘT hash SHA-256 duy nhất bằng Web Crypto API (có sẵn trên
 * mọi trình duyệt hiện đại, không cần thư viện ngoài).
 *
 * Nếu sau này ai thay ảnh, sửa tọa độ, hoặc chỉnh giờ — hash sẽ không
 * khớp nữa, hệ thống phát hiện được ngay.
 */
export async function computeProofOfLocationHash({ photoBlob, lat, lng, timestamp }) {
  const photoBuffer = await photoBlob.arrayBuffer();
  const photoBytes = new Uint8Array(photoBuffer);

  // Gộp thành 1 chuỗi text xác định (deterministic) trước khi hash
  const metaText = `lat:${lat.toFixed(6)}|lng:${lng.toFixed(6)}|ts:${timestamp}`;
  const metaBytes = new TextEncoder().encode(metaText);

  // Nối ảnh + metadata thành 1 buffer duy nhất
  const combined = new Uint8Array(photoBytes.length + metaBytes.length);
  combined.set(photoBytes, 0);
  combined.set(metaBytes, photoBytes.length);

  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return `0x${hashHex}`;
}

/**
 * Công thức Haversine — tính khoảng cách (mét) giữa 2 tọa độ GPS.
 * Dùng để so sánh vị trí thật lúc xác nhận với tọa độ tham chiếu
 * (địa chỉ đã khai báo, geocode qua Nominatim).
 */
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // bán kính Trái Đất, mét
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
