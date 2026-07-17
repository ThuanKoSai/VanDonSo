import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // HTTPS cần thiết để dùng Geolocation API và Camera API khi deploy thật.
    // Khi dev local trên localhost, trình duyệt vẫn cho phép dùng qua HTTP.
    port: 5173,
  },
});
