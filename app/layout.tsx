import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ĐẠI HỘI ĐẠI BIỂU ĐOÀN TNCS HỒ CHÍ MINH THÀNH PHỐ HUẾ 2025",
  description: "Tạo khung ảnh và gửi lời nhắn chúc mừng Đại hội XVII",
 icons: {
    icon: "/favicon.png",
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
        <link
          rel="preload"
          href="/fonts/UTM-Impact.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>

      <body className="min-h-screen antialiased bg-[#0782C5] text-gray-900">
        {children}
      </body>
    </html>
  );
}
