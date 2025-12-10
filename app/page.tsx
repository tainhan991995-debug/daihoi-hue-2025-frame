"use client";

import React, { useEffect, useRef, useState } from "react";
import "./form.css";
import "./cropper.css";

import { drawAvatar } from "@/components/canvas/drawAvatar";
import { drawTexts } from "@/components/canvas/drawTexts";
import { drawWatermark } from "@/components/canvas/drawLogos";

const API_URL =
  "https://script.google.com/macros/s/AKfycby6p-gDoHlx_cnlsK4iEo6p5pji-knN7LDmT5sRNgfzMAvRzTJQyJ5uyheWhQlmGhPC/exec";

// FRAME
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

// AVATAR
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

    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;

    const frameImg = new Image();
    frameImg.src = "/frame1.png";

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

        avatar.onload = () => {
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

    console.log("✓ Dữ liệu gửi JSON:", data);

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
          />

          <div className="label-box mt-4">Chức vụ - Đơn vị</div>
          <input
            className="form-input"
            placeholder="Nhập chức vụ - đơn vị…"
            onChange={(e) => setRoleUnit(e.target.value)}
          />

          <div className="label-box mt-4">Gửi lời nhắn</div>
          <textarea
            className="form-input"
            placeholder="Nhập lời nhắn…"
            maxLength={500}
            rows={6}
            onChange={(e) => setMessage(e.target.value)}
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
   ======================= CROP MODAL ====================
   ====================================================== */

function CropModal({ imageUrl, onClose, onUse }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [bmp, setBmp] = useState<any>(null);

  // Khung crop nhỏ hơn nếu là mobile
  const initialSize = isMobile ? 180 : 300;

  const [box, setBox] = useState({
    x: 120,
    y: 100,
    size: initialSize,
  });

  const drag = useRef({
    mode: null as "move" | "resize" | null,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
    os: 0,
  });

  /* LOAD IMAGE WITH SAFARI FALLBACK */
  useEffect(() => {
    (async () => {
      const blob = await (await fetch(imageUrl)).blob();
      let bitmap;

      try {
        bitmap = await createImageBitmap(blob);
      } catch {
        bitmap = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = URL.createObjectURL(blob);
        });
      }

      setBmp(bitmap);
    })();
  }, [imageUrl]);

  /* DRAW IMAGE */
  const draw = () => {
    if (!bmp || !canvasRef.current) return;

    const cv = canvasRef.current;
    const ctx = cv.getContext("2d")!;

    cv.width = cv.clientWidth;
    cv.height = cv.clientHeight;

    ctx.clearRect(0, 0, cv.width, cv.height);

    const scale = Math.min(cv.width / bmp.width, cv.height / bmp.height);
    const w = bmp.width * scale;
    const h = bmp.height * scale;

    const dx = (cv.width - w) / 2;
    const dy = (cv.height - h) / 2;

    (ctx as any).pos = { dx, dy, scale, w, h };

    ctx.drawImage(bmp, dx, dy, w, h);

    drawOverlay();
  };

  const drawOverlay = () => {
    const ov = overlayRef.current;
    if (!ov) return;

    const ctx = ov.getContext("2d")!;
    ov.width = ov.clientWidth;
    ov.height = ov.clientHeight;

    ctx.clearRect(0, 0, ov.width, ov.height);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, ov.width, ov.height);

    ctx.clearRect(box.x, box.y, box.size, box.size);

    ctx.strokeStyle = "#57A5FF";
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.size, box.size);
  };

  useEffect(draw, [bmp, box]);

  /* GET TOUCH OR MOUSE POINT */
  const getPoint = (e: any) => {
    if (e.touches) e = e.touches[0];
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /* DOWN */
  const onDown = (e: any) => {
    const { x, y } = getPoint(e);

    drag.current.sx = x;
    drag.current.sy = y;
    drag.current.ox = box.x;
    drag.current.oy = box.y;
    drag.current.os = box.size;

    const nearCorner = Math.abs(x - (box.x + box.size)) < 25 && Math.abs(y - (box.y + box.size)) < 25;

    drag.current.mode = nearCorner ? "resize" : "move";
  };

  /* MOVE */
  const onMove = (e: any) => {
    if (!drag.current.mode) return;

    const { x, y } = getPoint(e);
    const dx = x - drag.current.sx;
    const dy = y - drag.current.sy;

    const ov = overlayRef.current!;
    const maxW = ov.clientWidth;
    const maxH = ov.clientHeight;

    if (drag.current.mode === "move") {
      let newX = drag.current.ox + dx;
      let newY = drag.current.oy + dy;

      // Giới hạn không cho ra ngoài
      newX = Math.max(0, Math.min(maxW - box.size, newX));
      newY = Math.max(0, Math.min(maxH - box.size, newY));

      setBox({ ...box, x: newX, y: newY });
    }

    if (drag.current.mode === "resize") {
      let newSize = drag.current.os + dx;

      // Giới hạn kích thước nhỏ / lớn
      newSize = Math.max(isMobile ? 120 : 200, newSize);
      newSize = Math.min(maxW - box.x, newSize);
      newSize = Math.min(maxH - box.y, newSize);

      setBox({ ...box, size: newSize });
    }
  };

  const onUp = () => (drag.current.mode = null);

  /* CONFIRM CROP */
  const confirmCrop = async () => {
    const cv = canvasRef.current!;
    const pos = (cv.getContext("2d") as any).pos;

    const relX = (box.x - pos.dx) / pos.scale;
    const relY = (box.y - pos.dy) / pos.scale;
    const relSize = box.size / pos.scale;

    const outSize = isMobile ? 550 : 900;

    const off = new OffscreenCanvas(outSize, outSize);
    const octx = off.getContext("2d")!;

    octx.drawImage(bmp, relX, relY, relSize, relSize, 0, 0, outSize, outSize);

    const blob = await off.convertToBlob({ type: "image/jpeg", quality: 0.75 });

    const base64 = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });

    onUse(base64);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-xl w-[92%] max-w-[760px]">
        <h2 className="text-lg font-semibold mb-3">Cắt ảnh</h2>

        <div
          className="relative w-full h-[420px] bg-black rounded overflow-hidden"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          <canvas ref={canvasRef} className="absolute w-full h-full" />
          <canvas ref={overlayRef} className="absolute w-full h-full" />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose}>Hủy</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={confirmCrop}>
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}
