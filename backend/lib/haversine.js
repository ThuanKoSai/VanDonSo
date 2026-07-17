/**
 * Công thức Haversine — giống hệt logic đã dùng ở frontend (src/lib/hash.js),
 * lặp lại ở đây vì backend cần tự tính độc lập khi trả dữ liệu cho trang tra
 * cứu công khai (không thể tin frontend tự báo cáo khoảng cách).
 */
function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DISTANCE_THRESHOLD_METERS = 200;

function isDistanceFlagged(lat1, lng1, lat2, lng2) {
  return haversineDistanceMeters(lat1, lng1, lat2, lng2) > DISTANCE_THRESHOLD_METERS;
}

module.exports = { haversineDistanceMeters, isDistanceFlagged, DISTANCE_THRESHOLD_METERS };
