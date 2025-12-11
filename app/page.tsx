"use client";

import React, { useRef, useState, useEffect } from "react";
import "./form.css";

// API URL
const API_URL =
  "https://script.google.com/macros/s/AKfycby4NIv4f2JHteHz9U1nC-f60gs8pVtfTdlKCqvA6wyi-1w2uBQaDiUFMaHRA51so5hc/exec";

// FRAME
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

// REDUCE CANVAS SIZE ON MOBILE
const MOBILE_SCALE = 0.45;

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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rawImageURL, setRawImageURL] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState("");
  const [message, setMessage] = useState("");

  /* =====================================================
        RENDER CANVAS (WITH MOBILE SPEED MODE)
     ===================================================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Reduce canvas resolution on mobile for speed
    const SCALE = isMobile ? MOBILE_SCALE : 1;

    canvas.width = FRAME_WIDTH * SCALE;
    canvas.height = FRAME_HEIGHT * SCALE;

    const frame = new Image();
    frame.src = "/frame1.png";

    frame.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

      const drawText = () => {
        ctx.fillStyle = "#000";
        ctx.font = `${180 * SCALE}px Arial`;
        ctx.fillText(name, CONFIG.NAME_X * SCALE, CONFIG.NAME_Y * SCALE);
        ctx.fillText(roleUnit, CONFIG.WARD_X * SCALE, CONFIG.WARD_Y * SCALE);
        ctx.fillText(message, CONFIG.TEXT_X * SCALE, CONFIG.TEXT_Y * SCALE);
      };

      if (croppedImage) {
        const avatar = new Image();
        avatar.src = croppedImage;

        avatar.onload = () => {
          ctx.drawImage(
            avatar,
            AVATAR_X * SCALE,
            AVATAR_Y * SCALE,
            AVATAR_SIZE_DESKTOP * SCALE,
            AVATAR_SIZE_DESKTOP * SCALE
          );
          drawText();
        };
      } else drawText();
    };
  }, [croppedImage, name, roleUnit, message]);

  /* =====================================================
        MOBILE AUTO CROP (NO CROP UI)
     ===================================================== */
  const autoCropMobile = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const minSide = Math.min(bitmap.width, bitmap.height);

    const sx = (bitmap.width - minSide) / 2;
    const sy = (bitmap.height - minSide) / 2;

    const cv = document.createElement("canvas");
    cv.width = AVATAR_SIZE_MOBILE;
    cv.height = AVATAR_SIZE_MOBILE;

    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cv.width, cv.height);

    ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, cv.width, cv.height);

    return cv.toDataURL("image/jpeg", 0.85);
  };

  /* =====================================================
        HANDLE FILE INPUT
     ===================================================== */
  const handleFile = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (isMobile) {
      console.log("📱 MOBILE MODE: Auto crop & resize");

      const cropped = await autoCropMobile(f);
      setCroppedImage(cropped);
      return;
    }

    // Desktop → use crop modal
    const url = URL.createObjectURL(f);
    setRawImageURL(url);
    setShowCropper(true);
  };

  /* =====================================================
        SEND TO GOOGLE SHEET
     ===================================================== */
  const sendToGoogleSheet = async (base64: string) => {
    const payload = {
      name,
      roleUnit,
      message,
      base64Image: base64,
      userAgent: navigator.userAgent,
    };

    console.log("=== SEND TO GOOGLE SHEET ===", payload);

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  /* =====================================================
        DOWNLOAD FINAL IMAGE
     ===================================================== */
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Always export full resolution even if mobile preview is low-res
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = FRAME_WIDTH;
    exportCanvas.height = FRAME_HEIGHT;
    const ctx = exportCanvas.getContext("2d")!;

    const frame = new Image();
    frame.src = "/frame1.png";

    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

      if (croppedImage) {
        const avatar = new Image();
        avatar.src = croppedImage;

        avatar.onload = () => {
          ctx.drawImage(avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE_DESKTOP, AVATAR_SIZE_DESKTOP);
          ctx.fillStyle = "#000";
          ctx.font = "180px Arial";

          ctx.fillText(name, CONFIG.NAME_X, CONFIG.NAME_Y);
          ctx.fillText(roleUnit, CONFIG.WARD_X, CONFIG.WARD_Y);
          ctx.fillText(message, CONFIG.TEXT_X, CONFIG.TEXT_Y);

          const finalImg = exportCanvas.toDataURL("image/png");
          sendToGoogleSheet(finalImg);

          const a = document.createElement("a");
          a.href = finalImg;
          a.download = "loi-nhan.png";
          a.click();
        };
      }
    };
  };

  /* =====================================================
        UI
     ===================================================== */
  return (
    <div className="min-h-screen p-10 bg-[#cfe4ff] flex flex-col items-center">
      <img src="/center-logo.png" className="w-[820px] mb-10" />

      <div className="max-w-[1800px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-10">
        {/* LEFT PANEL */}
        <div className="bg-white p-10 rounded-2xl shadow-xl">
          <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <button className="form-button mb-6" onClick={() => document.getElementById("fileInput")?.click()}>
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

        {/* CANVAS (LOW RES ON MOBILE) */}
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-xl shadow-xl w-full" style={{ aspectRatio: "7550/3980" }} />
        </div>
      </div>

      {/* DESKTOP CROP MODAL */}
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

/* --------------------------------------------
   CROP MODAL — GIỮ NGUYÊN LOGIC BẢN CŨ
   (CHỈ DÙNG CHO DESKTOP)
--------------------------------------------- */

function CropModal({ imageUrl, onClose, onUse }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 rounded-xl w-[760px]">
        <h2 className="text-lg font-bold mb-4">Cắt ảnh (Desktop)</h2>

        <img src={imageUrl} className="w-full rounded" />

        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onUse(imageUrl)}>
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}
