import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

// Fix lỗi kinh điển của Leaflet trong bundler: icon mặc định mất đường dẫn ảnh
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Bản đồ hành trình — nhận mảng điểm [{lat, lng, label}], vẽ marker theo
 * thứ tự + đường nối. Dùng OpenStreetMap (miễn phí, không cần API key).
 */
export default function MapView({ points = [], height = 320 }) {
  const valid = points.filter(
    (p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))
  );

  if (!valid.length) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-2 bg-paper border border-dashed border-rule rounded-none text-inksoft text-sm"
      >
        <MapPin size={22} />
        Chưa có dữ liệu tọa độ để hiển thị bản đồ
      </div>
    );
  }

  const center = [Number(valid[valid.length - 1].lat), Number(valid[valid.length - 1].lng)];
  const line = valid.map((p) => [Number(p.lat), Number(p.lng)]);

  return (
    <div style={{ height }} className="rounded-none overflow-hidden border border-rule relative z-0">
      <MapContainer center={center} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {valid.length > 1 && <Polyline positions={line} pathOptions={{ color: "#2F5D3A", weight: 3, dashArray: "6 6" }} />}
        {valid.map((p, i) => (
          <Marker key={i} position={[Number(p.lat), Number(p.lng)]} icon={markerIcon}>
            {p.label && <Popup>{p.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
