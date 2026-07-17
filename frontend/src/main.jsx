import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// App.jsx tự bọc đủ ErrorBoundary > WalletProvider > ToastProvider >
// BrowserRouter bên trong nó rồi (xem App.jsx) — trước đây file này lại
// bọc thêm một lớp y hệt bên ngoài, khiến cả 4 thứ đó bị khởi tạo HAI LẦN
// LỒNG NHAU (đặc biệt 2 BrowserRouter lồng nhau là điều React Router
// khuyến cáo không nên làm). Vì React Context luôn lấy Provider gần nhất,
// lớp bọc ở đây trước nay không hề gây sai kết quả — nhưng là code thừa,
// dễ gây hiểu lầm cho người đọc sau. Chỉ cần render <App/> trực tiếp.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
