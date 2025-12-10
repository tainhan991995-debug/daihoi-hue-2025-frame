"use client";

import React, { useEffect, useRef, useState } from "react";
import "./form.css";
import "./cropper.css";

import { drawAvatar } from "@/components/canvas/drawAvatar";
import { drawTexts } from "@/components/canvas/drawTexts";
import { drawWatermark } from "@/components/canvas/drawLogos";

/**
 * YOUR GOOGLE SHEET WEBAPP URL (replace if needed)
 */
const API_URL =
  "https://script.google.com/macros/s/AKfycby4NIv4f2JHteHz9U1nC-f60gs8pVtfTdlKCqvA6wyi-1w2uBQaDiUFMaHRA51so5hc/exec";

// FRAME
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

// AVATAR default (desktop high quality)
const AVATAR_SIZE_DESKTOP = 1450;
const AVATAR_SIZE_MOBILE = 700; // smaller for phone

const AVATAR_SIZE = typeof window !== "undefined" && window.innerWidth < 768 ? AVATAR_SIZE_MOBILE : AVATAR_SIZE_DESKTOP;
const AVATAR_X = 1450 - AVATAR_SIZE / 2;
const AVATAR_Y = 1290 - 118;

// TEXT CONFIG
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
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState("");
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ================= RENDER FRAME + AVATAR + TEXT ================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Full resolution internal canvas
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;

    const frameImg = new Image();
    frameImg.src = "/frame1.png";
    frameImg.crossOrigin = "anonymous";

    frameImg.onload = () => {
      ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.drawImage(frameImg, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

      const drawContent = () => {
        drawTexts(ctx, name, roleUnit, message, CONFIG);
        drawWatermark(
          ctx,
          "ĐẠI HỘI ĐOÀN TNCS HỒ CHÍ MINH TP HUẾ 2025",
          7350,
          3920
        );
      };

      if (croppedImage) {
        const avatar = new Image();
        avatar.src = croppedImage;
        avatar.crossOrigin = "anonymous";
        avatar.onload = () => {
          // Use the chosen AVATAR_SIZE (smaller for mobile)
          drawAvatar(ctx, avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE);
          drawContent();
        };
      } else drawContent();
    };
  }, [croppedImage, name, roleUnit, message]);

  const chooseFile = () =>
    document.getElementById("fileInput")?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    setRawImageURL(url);
    setShowCropper(true);
  };

  /* ================= SEND TO GOOGLE SHEET (JSON) ================= */
  const sendToGoogleSheet = async (base64Image: string) => {
    try {
      const data = {
        name,
        roleUnit,
        message,
        base64Image,
        userAgent: navigator.userAgent,
      };

      console.log("✓ Dữ liệu gửi JSON:", {
        ...data,
        base64Image: base64Image.slice(0, 200) + "...(truncated)", // don't spam console
      });

      // Use no-cors if your Apps Script is deployed as "anyone, even anonymous"
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("✓ Gửi Google Sheet thành công (JSON + no-cors)");
    } catch (err) {
      console.error("Lỗi gửi Google Sheet:", err);
    }
  };

  /* ================= DOWNLOAD ================= */
  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export at reasonable size for web
    const dataUrl = canvas.toDataURL("image/png");
    await sendToGoogleSheet(dataUrl);

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "loi-nhan.png";
    a.click();
  };

  return (
    <div className="min-h-screen p-10 bg-[#cfe4ff] flex flex-col items-center">
      <img src="/center-logo.png" className="w-[820px] mb-10" />

      <div className="max-w-[1800px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-10">
        {/* LEFT */}
        <div className="bg-white p-10 rounded-2xl shadow-xl">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <button className="form-button mb-6" onClick={chooseFile}>
            📷 Chọn ảnh
          </button>

          <div className="label-box">Họ và tên</div>
          <input
            className="form-input"
            placeholder="Nhập họ và tên…"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />

          <div className="label-box mt-4">Chức vụ - Đơn vị</div>
          <input
            className="form-input"
            placeholder="Nhập chức vụ - đơn vị…"
            onChange={(e) => setRoleUnit(e.target.value)}
            value={roleUnit}
          />

          <div className="label-box mt-4">Gửi lời nhắn</div>
          <textarea
            className="form-input"
            placeholder="Nhập lời nhắn…"
            maxLength={500}
            rows={6}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
          />

          <div className="text-right text-gray-500 text-sm">
            {message.length}/500
          </div>

          <button onClick={downloadImage} className="btn-primary mt-6">
            Tải lời nhắn về
          </button>
        </div>

        {/* CANVAS */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-xl shadow-xl"
            style={{ width: "100%", aspectRatio: "7550 / 3980" }}
          />
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
  function CropModal({ imageUrl, onClose, onUse }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [bmp, setBmp] = useState<ImageBitmap | null>(null);

  // Box crop hình vuông
  const [box, setBox] = useState({
    x: 0,
    y: 0,
    size: 200,
  });

  const dragging = useRef({
    mode: null as "move" | "resize" | null,
    startX: 0,
    startY: 0,
    boxStart: { x: 0, y: 0, size: 200 },
  });

  /* LOAD IMAGE */
  useEffect(() => {
    (async () => {
      const blob = await (await fetch(imageUrl)).blob();
      const bitmap = await createImageBitmap(blob);
      setBmp(bitmap);
    })();
  }, [imageUrl]);

  /* DRAW IMAGE + OVERLAY */
  const drawAll = () => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");

    if (!cv || !ctx || !bmp) return;

    cv.width = cv.clientWidth;
    cv.height = cv.clientHeight;

    ctx.clearRect(0, 0, cv.width, cv.height);

    const scale = Math.min(cv.width / bmp.width, cv.height / bmp.height);
    const drawW = bmp.width * scale;
    const drawH = bmp.height * scale;
    const dx = (cv.width - drawW) / 2;
    const dy = (cv.height - drawH) / 2;

    (ctx as any).pos = { dx, dy, drawW, drawH, scale };

    ctx.drawImage(bmp, dx, dy, drawW, drawH);

    // Auto-center crop box once
    if (box.size < 10) {
      const s = Math.min(cv.width, cv.height) * 0.45;
      setBox({
        x: (cv.width - s) / 2,
        y: (cv.height - s) / 2,
        size: s,
      });
    }
  };

  useEffect(() => drawAll(), [bmp, box]);

  /* TOUCH HANDLERS – FULL MOBILE SUPPORT */
  const onTouchStart = (e: TouchEvent) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    dragging.current.startX = x;
    dragging.current.startY = y;
    dragging.current.boxStart = { ...box };

    // near bottom-right corner → resize
    if (Math.abs(x - (box.x + box.size)) < 30 &&
        Math.abs(y - (box.y + box.size)) < 30) {
      dragging.current.mode = "resize";
    }
    // inside box → move
    else if (x > box.x && x < box.x + box.size && y > box.y && y < box.y + box.size) {
      dragging.current.mode = "move";
    } else {
      dragging.current.mode = null;
    }

    e.preventDefault();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!overlayRef.current || !dragging.current.mode) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    const dx = x - dragging.current.startX;
    const dy = y - dragging.current.startY;

    if (dragging.current.mode === "move") {
      setBox({
        ...box,
        x: dragging.current.boxStart.x + dx,
        y: dragging.current.boxStart.y + dy,
      });
    }

    if (dragging.current.mode === "resize") {
      const newSize = Math.max(60, dragging.current.boxStart.size + dx);
      setBox({
        ...box,
        size: newSize,
      });
    }

    e.preventDefault();
  };

  const onTouchEnd = () => {
    dragging.current.mode = null;
  };

  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;

    ov.addEventListener("touchstart", onTouchStart, { passive: false });
    ov.addEventListener("touchmove", onTouchMove, { passive: false });
    ov.addEventListener("touchend", onTouchEnd);

    return () => {
      ov.removeEventListener("touchstart", onTouchStart);
      ov.removeEventListener("touchmove", onTouchMove);
      ov.removeEventListener("touchend", onTouchEnd);
    };
  });

  /* CONFIRM CROP */
  const confirmCrop = async () => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d") as any;
    const pos = ctx.pos;

    if (!pos || !bmp) return;

    const relX = (box.x - pos.dx) / pos.scale;
    const relY = (box.y - pos.dy) / pos.scale;
    const relSize = box.size / pos.scale;

    const out = document.createElement("canvas");
    const outSize = window.innerWidth < 768 ? 700 : 1450;
    out.width = outSize;
    out.height = outSize;

    const octx = out.getContext("2d")!;
    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, outSize, outSize);

    octx.drawImage(bmp, relX, relY, relSize, relSize, 0, 0, outSize, outSize);

    const data = out.toDataURL("image/png");
    onUse(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 rounded-xl max-w-[95vw] w-[760px]">
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-semibold">Cắt ảnh</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="relative w-full h-[480px] bg-black rounded overflow-hidden">
          <canvas ref={canvasRef} className="absolute w-full h-full" />

          {/* Transparent overlay to catch touch events */}
          <div
            ref={overlayRef}
            className="absolute inset-0"
            style={{
              border: "2px solid transparent",
              touchAction: "none",
            }}
          >
            {/* Crop box visual */}
            <div
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.size,
                height: box.size,
                border: "3px solid #3b82f6",
              }}
            />
          </div>
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

