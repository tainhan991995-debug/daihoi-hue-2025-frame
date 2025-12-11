"use client";

import React, { useRef, useState, useEffect } from "react";
import "./form.css";

// Google Sheet URL
const API_URL =
  "https://script.google.com/macros/s/AKfycby4NIv4f2JHteHz9U1nC-f60gs8pVtfTdlKCqvA6wyi-1w2uBQaDiUFMaHRA51so5hc/exec";

// FRAME SIZE
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

// AVATAR OUTPUT SIZE
const AVATAR_SIZE_DESKTOP = 1450;
const AVATAR_SIZE_MOBILE = 750;

// AVATAR POSITION
const AVATAR_X = 1450 - AVATAR_SIZE_DESKTOP / 2;
const AVATAR_Y = 1290 - 118;

// TEXT POSITION CONFIG
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

/* ------------------------------------------
    AUTO-CROP MIDDLE SQUARE (MOBILE ONLY)
--------------------------------------------- */
async function autoCropMobile(file: File) {
  const bitmap = await createImageBitmap(file);
  const minSide = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - minSide) / 2;
  const sy = (bitmap.height - minSide) / 2;

  const outSize = AVATAR_SIZE_MOBILE;

  const cv = document.createElement("canvas");
  cv.width = outSize;
  cv.height = outSize;

  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outSize, outSize);

  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, outSize, outSize);

  return cv.toDataURL("image/jpeg", 0.85);
}

/* ======================================================
                    PAGE MAIN FUNCTION
====================================================== */
export default function Page() {
  const [rawImageURL, setRawImageURL] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState("");
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  /* ---------------- DRAW FRAME + AVATAR + TEXT ---------------- */
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

      // Draw texts
      ctx.font = "bold 180px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(name, CONFIG.NAME_X, CONFIG.NAME_Y);
      ctx.fillText(roleUnit, CONFIG.WARD_X, CONFIG.WARD_Y);
      ctx.fillText(message, CONFIG.TEXT_X, CONFIG.TEXT_Y);

      // Draw avatar
      if (croppedImage) {
        const avatar = new Image();
        avatar.src = croppedImage;

        avatar.onload = () => {
          ctx.drawImage(
            avatar,
            AVATAR_X,
            AVATAR_Y,
            AVATAR_SIZE_DESKTOP,
            AVATAR_SIZE_DESKTOP
          );
        };
      }
    };
  }, [croppedImage, name, roleUnit, message]);

  /* ------------------- FILE HANDLER ------------------- */
  const handleFile = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;

    console.log("📱 Mobile detection:", isMobile);

    if (isMobile) {
      // 🔥 MOBILE: auto-crop, no crop modal
      console.log("📱 MOBILE MODE: Auto-crop + resize (no modal)");
      const cropped = await autoCropMobile(f);
      setCroppedImage(cropped);
      setShowCropper(false);
      setRawImageURL(null);
      return;
    }

    // 💻 DESKTOP: use crop modal
    const url = URL.createObjectURL(f);
    setRawImageURL(url);
    setShowCropper(true);
  };

  /* ---------------- SEND TO GOOGLE SHEET ---------------- */
  const sendToGoogleSheet = async (base64: string) => {
    const payload = {
      name,
      roleUnit,
      message,
      base64Image: base64,
      userAgent: navigator.userAgent,
    };

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("✓ Data sent to Google Sheet");
    } catch (err) {
      console.error("Lỗi gửi Google Sheet:", err);
    }
  };

  /* ---------------- SAVE IMAGE ---------------- */
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

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen p-10 bg-[#cfe4ff] flex flex-col items-center">
      <img src="/center-logo.png" className="w-[820px] mb-10" />

      <div className="max-w-[1800px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-10">
        {/* LEFT PANEL */}
        <div className="bg-white p-10 rounded-2xl shadow-xl">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

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

        {/* CANVAS */}
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-xl shadow-xl w-full" style={{ aspectRatio: "7550/3980" }} />
        </div>
      </div>

      {/* DESKTOP CROP MODAL */}
      {!isMobile && showCropper && rawImageURL && (
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
                        DESKTOP CROP MODAL
====================================================== */
function CropModal({ imageUrl, onClose, onUse }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [box, setBox] = useState({ x: 200, y: 200, size: 300 });

  const drag = useRef<any>({
    mode: null,
    start: { x: 0, y: 0 },
    boxStart: null,
  });

  /* LOAD IMAGE */
  useEffect(() => {
    (async () => {
      const blob = await (await fetch(imageUrl)).blob();
      const bitmap = await createImageBitmap(blob);
      setBmp(bitmap);
    })();
  }, [imageUrl]);

  const drawAll = () => {
    if (!bmp || !canvasRef.current) return;

    const cv = canvasRef.current;
    cv.width = cv.clientWidth;
    cv.height = cv.clientHeight;

    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);

    const scale = Math.min(cv.width / bmp.width, cv.height / bmp.height);
    const w = bmp.width * scale;
    const h = bmp.height * scale;
    const dx = (cv.width - w) / 2;
    const dy = (cv.height - h) / 2;

    (ctx as any).pos = { dx, dy, w, h, scale };
    ctx.drawImage(bmp, dx, dy, w, h);

    drawOverlay();
  };

  const drawOverlay = () => {
    const ov = overlayRef.current;
    if (!ov) return;

    ov.width = ov.clientWidth;
    ov.height = ov.clientHeight;

    const ctx = ov.getContext("2d")!;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, ov.width, ov.height);

    ctx.clearRect(box.x, box.y, box.size, box.size);

    ctx.strokeStyle = "#4aa3ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.size, box.size);
  };

  useEffect(() => drawAll(), [bmp, box]);

  const onMouseDown = (e: any) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drag.current.start = { x, y };
    drag.current.boxStart = { ...box };

    if (Math.abs(x - (box.x + box.size)) < 20) drag.current.mode = "resize";
    else if (x > box.x && x < box.x + box.size) drag.current.mode = "move";
  };

  const onMouseMove = (e: any) => {
    if (!drag.current.mode) return;

    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - drag.current.start.x;

    if (drag.current.mode === "move") {
      setBox({
        ...box,
        x: drag.current.boxStart.x + dx,
        y: drag.current.boxStart.y + (y - drag.current.start.y),
      });
    }

    if (drag.current.mode === "resize") {
      let newSize = Math.max(80, drag.current.boxStart.size + dx);
      setBox({ ...box, size: newSize });
    }
  };

  const onMouseUp = () => (drag.current.mode = null);

  /* CONFIRM CROP */
  const confirmCrop = async () => {
    const cv = canvasRef.current!;
    const pos = (cv.getContext("2d") as any).pos;

    const relX = (box.x - pos.dx) / pos.scale;
    const relY = (box.y - pos.dy) / pos.scale;
    const relSize = box.size / pos.scale;

    const out = new OffscreenCanvas(AVATAR_SIZE_DESKTOP, AVATAR_SIZE_DESKTOP);
    const octx = out.getContext("2d")!;

    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, AVATAR_SIZE_DESKTOP, AVATAR_SIZE_DESKTOP);

    octx.drawImage(
      bmp!,
      relX,
      relY,
      relSize,
      relSize,
      0,
      0,
      AVATAR_SIZE_DESKTOP,
      AVATAR_SIZE_DESKTOP
    );

    const blob = await out.convertToBlob({ type: "image/png" });

    const base64 = await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });

    onUse(base64);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 rounded-xl max-w-[760px] w-full">
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-bold">Cắt ảnh</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div
          className="relative w-full h-[480px] bg-black rounded overflow-hidden"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <canvas ref={canvasRef} className="absolute w-full h-full" />
          <canvas
            ref={overlayRef}
            className="absolute w-full h-full"
            onMouseDown={onMouseDown}
          />
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
