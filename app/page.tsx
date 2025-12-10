"use client";

import React, { useRef, useState, useEffect } from "react";
import "./form.css";

// API URL
const API_URL =
  "https://script.google.com/macros/s/AKfycby4NIv4f2JHteHz9U1nC-f60gs8pVtfTdlKCqvA6wyi-1w2uBQaDiUFMaHRA51so5hc/exec";

// FRAME
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

// AVATAR OUTPUT SIZE
const AVATAR_SIZE_DESKTOP = 1450;
const AVATAR_SIZE_MOBILE = 750;

// AVATAR POSITION
const AVATAR_X = 1450 - AVATAR_SIZE_DESKTOP / 2;
const AVATAR_Y = 1290 - 118;

// TEXT POSITIONS
const CONFIG = {
  NAME_X: 1440,
  NAME_Y: 2910,
  NAME_MAX_WIDTH: 1750,

  WARD_X: 1480,
  WARD_Y: 3280,
  WARD_WIDTH: 1850,
  WARD_LINE_HEIGHT: 95,

  TEXT_X: 2950,
  TEXT_Y: 2030,
  TEXT_WIDTH: 4150,
  TEXT_LINE_HEIGHT: 190,
};

export default function Page() {
  const [rawImageURL, setRawImageURL] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState("");
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ---------------- DRAW FRAME + AVATAR + TEXT ----------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;

    const frame = new Image();
    frame.src = "/frame1.png";

    frame.onload = () => {
      ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.drawImage(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

      const drawText = () => {
        ctx.font = "bold 180px Arial";
        ctx.fillStyle = "#000";
        ctx.fillText(name, CONFIG.NAME_X, CONFIG.NAME_Y);
        ctx.fillText(roleUnit, CONFIG.WARD_X, CONFIG.WARD_Y);
        ctx.fillText(message, CONFIG.TEXT_X, CONFIG.TEXT_Y);
      };

      if (croppedImage) {
        const avatar = new Image();
        avatar.src = croppedImage;

        avatar.onload = () => {
          ctx.drawImage(avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE_DESKTOP, AVATAR_SIZE_DESKTOP);
          drawText();
        };
      } else drawText();
    };
  }, [croppedImage, name, roleUnit, message]);

  const chooseFile = () => document.getElementById("fileInput")?.click();

  const handleFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setRawImageURL(url);
    setShowCropper(true);
  };

  // ---------------- SEND DATA TO GOOGLE SHEET ----------------
  const sendToGoogleSheet = async (base64: string) => {
    const payload = {
      name,
      roleUnit,
      message,
      base64Image: base64,
      userAgent: navigator.userAgent,
    };

    console.log("=== SEND TO GOOGLE SHEET ===");
    console.log("Payload:", payload);

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Đã gửi xong (no-cors → không đọc được phản hồi)");
    } catch (err) {
      console.error("Lỗi gửi:", err);
    }
  };

  // ---------------- DOWNLOAD IMAGE ----------------
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/png");
    sendToGoogleSheet(base64);

    const a = document.createElement("a");
    a.href = base64;
    a.download = "loi-nhan.png";
    a.click();
  };

  return (
    <div className="min-h-screen p-10 bg-[#cfe4ff] flex flex-col items-center">
      <img src="/center-logo.png" className="w-[820px] mb-10" />

      <div className="max-w-[1800px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-10">
        {/* LEFT */}
        <div className="bg-white p-10 rounded-2xl shadow-xl">
          <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <button className="form-button mb-6" onClick={chooseFile}>
            📷 Chọn ảnh
          </button>

          <div className="label-box">Họ và tên</div>
          <input className="form-input" onChange={(e) => setName(e.target.value)} />

          <div className="label-box mt-4">Chức vụ - Đơn vị</div>
          <input className="form-input" onChange={(e) => setRoleUnit(e.target.value)} />

          <div className="label-box mt-4">Gửi lời nhắn</div>
          <textarea className="form-input" rows={6} maxLength={500} onChange={(e) => setMessage(e.target.value)} />

          <div className="text-right">{message.length}/500</div>

          <button className="btn-primary mt-6" onClick={downloadImage}>
            Tải lời nhắn về
          </button>
        </div>

        {/* CANVAS */}
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-xl shadow-xl w-full" style={{ aspectRatio: "7550/3980" }} />
        </div>
      </div>

      {/* CROP MODAL */}
      {showCropper && rawImageURL && (
        <CropModal
          imageUrl={rawImageURL}
          onClose={() => {
            URL.revokeObjectURL(rawImageURL);
            setShowCropper(false);
          }}
          onUse={(img: string) => {
            setCroppedImage(img);
            setShowCropper(false);
          }}
        />
      )}
    </div>
  );
}

/* ======================================================
   ======================= CROP MODAL ====================
   ========== MOBILE VERSION FIXED (WORKS 100%) ==========
   ====================================================== */

function CropModal({ imageUrl, onClose, onUse }: any) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [box, setBox] = useState({ x: 80, y: 80, size: 220 });

  // track dragging
  const drag = useRef({ active: false, offsetX: 0, offsetY: 0, mode: "move" });

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ------ TOUCH START ------
  const onStart = (e: any) => {
    const touch = e.touches?.[0] || e;
    const rect = boxRef.current!.getBoundingClientRect();

    const inside =
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom;

    const inCorner =
      Math.abs(touch.clientX - rect.right) < 32 &&
      Math.abs(touch.clientY - rect.bottom) < 32;

    drag.current.mode = inCorner ? "resize" : "move";
    drag.current.active = true;
    drag.current.offsetX = touch.clientX - rect.left;
    drag.current.offsetY = touch.clientY - rect.top;

    e.preventDefault();
  };

  // ------ TOUCH MOVE ------
  const onMove = (e: any) => {
    if (!drag.current.active) return;
    const touch = e.touches?.[0] || e;
    const contRect = containerRef.current!.getBoundingClientRect();

    if (drag.current.mode === "move") {
      let newX = touch.clientX - contRect.left - drag.current.offsetX;
      let newY = touch.clientY - contRect.top - drag.current.offsetY;

      newX = Math.max(0, Math.min(newX, contRect.width - box.size));
      newY = Math.max(0, Math.min(newY, contRect.height - box.size));

      setBox((b) => ({ ...b, x: newX, y: newY }));
    }

    if (drag.current.mode === "resize") {
      let newSize = touch.clientX - (contRect.left + box.x);
      newSize = Math.max(80, Math.min(newSize, contRect.width - box.x, contRect.height - box.y));
      setBox((b) => ({ ...b, size: newSize }));
    }

    e.preventDefault();
  };

  const onEnd = () => (drag.current.active = false);

  // ------ CONFIRM CROP ------
  const confirmCrop = () => {
    const img = imgRef.current!;
    const cont = containerRef.current!;
    const scale = img.width / cont.clientWidth;

    const sx = box.x * scale;
    const sy = box.y * scale;
    const sSize = box.size * scale;

    const outSize = isMobile ? AVATAR_SIZE_MOBILE : AVATAR_SIZE_DESKTOP;

    const cv = document.createElement("canvas");
    cv.width = outSize;
    cv.height = outSize;
    const ctx = cv.getContext("2d")!;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outSize, outSize);

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outSize, outSize);

    onUse(cv.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 rounded-xl w-full max-w-[760px]">
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-bold">Cắt ảnh</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div
          ref={containerRef}
          className="relative w-full h-[420px] bg-black overflow-hidden rounded"
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        >
          <img ref={imgRef} src={imageUrl} className="w-full h-full object-contain" />

          {/* CROP BOX */}
          <div
            ref={boxRef}
            style={{
              position: "absolute",
              border: "3px solid #4aa3ff",
              left: box.x,
              top: box.y,
              width: box.size,
              height: box.size,
            }}
          ></div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Hủy
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={confirmCrop}>
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}
