/**
 * Geocode địa chỉ text -> tọa độ, dùng Nominatim (OpenStreetMap) — miễn phí,
 * không cần API key. Giới hạn ~1 request/giây, không gọi dồn dập.
 */
export async function geocodeAddress(addressText) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    addressText
  )}`;

  const res = await fetch(url, {
    headers: { "Accept-Language": "vi" },
  });

  if (!res.ok) throw new Error("Không thể xác định tọa độ cho địa chỉ này.");

  const results = await res.json();
  if (!results.length) {
    throw new Error("Không tìm thấy tọa độ khớp với địa chỉ đã nhập.");
  }

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}
