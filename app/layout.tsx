import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KỶ NIỆM 70 NĂM NGÀY TRUYỀN THỐNG HỘI LHTN VIỆT NAM",
  description: "Tạo khung ảnh và gửi lời chúc mừng kỷ niệm 70 năm ngày truyền thống Hội LHTN Việt Nam",
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
