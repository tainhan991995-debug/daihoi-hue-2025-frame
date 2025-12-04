"use client";

import { useState, useRef, useEffect } from "react";
import { drawAvatar } from "@/components/canvas/drawAvatar";
import { drawTexts } from "@/components/canvas/drawTexts";
import { drawWatermark } from "@/components/canvas/drawLogos";

const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

// Avatar
const AVATAR_SIZE = 1450;
const AVATAR_X = 1450 - AVATAR_SIZE / 2;
const AVATAR_Y = 1290 - 118;

// TEXT CONFIG
const CONFIG = {
  NAME_X: 1440,
  NAME_Y: 2910,
  NAME_MAX_WIDTH: 1750,

  WARD_X: 1480,
WARD_Y: 3280,
WARD_WIDTH: 1850,        // <== CHUẨN BẠN YÊU CẦU
WARD_LINE_HEIGHT: 95,   // <== CHIỀU CAO MỖI DÒNG

  TEXT_X: 2950,
  TEXT_Y: 2030,
  TEXT_WIDTH: 4150,
  TEXT_LINE_HEIGHT: 190,
};

export default function Page() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState(""); // 💥 chỉ 1 ô: Chức vụ - Đơn vị
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // HANDLE IMAGE UPLOAD
  const handleImageChange = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  // ==============================================
  // 🔥 USE EFFECT — VẼ CANVAS SAU KHI FONT ĐÃ LOAD
  // ==============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawAll = async () => {
      try {
        await document.fonts.load(`260px UTMImpact`);
        await document.fonts.ready;
      } catch (err) {
        console.warn("⚠ Font loading API không sẵn sàng:", err);
      }

      const frame = new Image();
      frame.src = "/frame1.png";

      frame.onload = () => {
        if (cancelled) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

        if (selectedImage) {
          const avatar = new Image();
          avatar.src = selectedImage;

          avatar.onload = () => {
            if (cancelled) return;
            drawAvatar(ctx, avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE);

            // 💥 CHỈ TRUYỀN 1 Ô: roleUnit
            drawTexts(ctx, name, roleUnit, message, CONFIG);

            drawWatermark(
              ctx,
              "ĐẠI HỘI ĐOÀN TNCS HỒ CHÍ MINH TP HUẾ 2025",
              7350,
              3920
            );
          };
        } else {
          drawTexts(ctx, name, roleUnit, message, CONFIG);

          drawWatermark(
            ctx,
            "ĐẠI HỘI ĐOÀN TNCS HỒ CHÍ MINH TP HUẾ 2025",
            7350,
            3920
          );
        }
      };
    };

    drawAll();
    return () => {
      cancelled = true;
    };
  }, [selectedImage, name, roleUnit, message]);

  // DOWNLOAD IMAGE
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const a = document.createElement("a");
    a.download = "loi-nhan.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="min-h-screen p-6 bg-[#cfe4ff]">

      {/* HEADER LOGO */}
      <div className="w-full flex justify-center mt-4 mb-10">
        <img src="/center-logo.png" className="w-[1020px] h-auto drop-shadow-lg" />
      </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[0.3fr_0.7fr] gap-10">

        {/* FORM */}
        <div
          className="space-y-6 bg-white/90 rounded-2xl shadow-md p-8 backdrop-blur-lg overflow-y-auto"
          style={{ maxHeight: "850px" }}
        >
          <h1 className="text-3xl font-bold text-slate-800">Gửi lời nhắn</h1>

          {/* UPLOAD */}
          <div>
            <label className="text-sm font-medium text-slate-700">Ảnh chân dung</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:px-4 file:py-2 rounded-lg cursor-pointer"
            />
          </div>

          <Input label="Họ và tên" maxLength={50} onChange={(e) => setName(e.target.value)} />

          {/* 💥 CHỈ 1 Ô: CHỨC VỤ - ĐƠN VỊ */}
          <Input
            label="Chức vụ - Đơn vị"
            maxLength={500}
            onChange={(e) => setRoleUnit(e.target.value)}
          />

          {/* MESSAGE */}
          <div>
            <label className="text-sm font-medium text-slate-700">Lời nhắn (tối đa 500 ký tự)</label>
            <textarea
              rows={6}
              maxLength={500}
              className="border rounded-xl px-4 py-3 w-full mt-1 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nhập lời nhắn…"
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-right text-xs text-slate-500">{message.length}/500</div>
          </div>

          <button
            onClick={downloadImage}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 active:scale-95 transition shadow-md"
          >
            Tải ảnh lời nhắn
          </button>
        </div>

        {/* CANVAS */}
        <div className="flex justify-center items-start">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              maxWidth: "1150px",
              height: "auto",
              aspectRatio: "7550 / 3980",
              border: "1px solid #ccc",
              borderRadius: "12px",
              background: "white",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, maxLength, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        maxLength={maxLength}
        placeholder={label}
        onChange={onChange}
        className="border rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}
