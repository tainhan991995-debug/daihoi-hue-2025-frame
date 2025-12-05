import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ĐẠI HỘI ĐẠI BIỂU ĐOÀN TNCS HỒ CHÍ MINH THÀNH PHỐ HUẾ 2025",
  description: "Tạo khung ảnh và gửi lời nhắn chúc mừng Đại hội XVII",
  icons: {
    icon: "/favicon.png",          // favicon trình duyệt
    shortcut: "/favicon.png",      // favicon dạng shortcut
    apple: "/favicon.png",         // hỗ trợ iOS
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* Preload font UTM Impact */}
        <link
          rel="preload"
          href="/fonts/UTM-Impact.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
