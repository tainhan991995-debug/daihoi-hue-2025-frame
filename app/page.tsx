"use client";

import React, { useEffect, useRef, useState } from "react";
import "./form.css";
import "./cropper.css";

import { drawAvatar } from "@/components/canvas/drawAvatar";
import { drawTexts } from "@/components/canvas/drawTexts";
import { drawWatermark } from "@/components/canvas/drawLogos";

/* -------------------------------
    CONSTANTS / CONFIG
-------------------------------- */
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

const AVATAR_SIZE = 1450;
const AVATAR_X = 1450 - AVATAR_SIZE / 2;
const AVATAR_Y = 1290 - 118;

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

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwTvZqv_QfcWI1v252yqSiUwF7zcqcLKFsvFY6CXjiVydvkk9dPiBu2AV-Cwp4Wl8P4/exec";

/* -------------------------------
    MOBILE AUTO CROP
-------------------------------- */
const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

async function autoCropMobile(file: File) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;

      const cv = document.createElement("canvas");
      cv.width = AVATAR_SIZE;
      cv.height = AVATAR_SIZE;

      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

      resolve(cv.toDataURL("image/jpeg", 0.9));
    };

    img.src = URL.createObjectURL(file);
  });
}

/* -------------------------------
    HELPER
-------------------------------- */
function removeVietnamese(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/ /g, "_");
}

/* ==========================================================
    MAIN PAGE
========================================================== */
export default function Page() {
  const [rawImageURL, setRawImageURL] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState("");
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ------------------------ RENDER CANVAS ------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;

    const frameImg = new Image();
    frameImg.src = "/frame1.png";

    frameImg.onload = () => {
      ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.drawImage(frameImg, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

      if (croppedImage) {
        const avatar = new Image();
        avatar.src = croppedImage;
        avatar.onload = () => {
          drawAvatar(ctx!, avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE);
          drawFinalTexts(ctx!);
        };
      } else {
        drawFinalTexts(ctx!);
      }
    };

    function drawFinalTexts(ctx: CanvasRenderingContext2D) {
      drawTexts(ctx!, name, roleUnit, message, CONFIG);
      drawWatermark(
        ctx!,
        "ĐẠI HỘI ĐOÀN TNCS HỒ CHÍ MINH TP HUẾ 2025",
        7350,
        3920
      );
    }
  }, [croppedImage, name, roleUnit, message]);

  /* -------------------------- FILE PICKER ------------------------- */
  const chooseFile = () =>
    document.getElementById("fileInput")?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (!f) return;

  // 👉 MOBILE: auto-crop, không mở CropModal
  if (isMobile()) {
    const croppedBase64 = await autoCropMobile(f);
    setCroppedImage(croppedBase64);
    return;
  }

  // 👉 DESKTOP: mở CropModal
  const url = URL.createObjectURL(f);
  setRawImageURL(url);
  setShowCropper(true);
};


  /* -------------------------- DOWNLOAD + SEND (FAST) ------------------------- */
const sendToDrive = async (blob: Blob) => {
  const cleanName = removeVietnamese(name || "nguoi-dung");
  const filename = `${cleanName}-${Date.now()}.jpg`;

  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Full = reader.result as string;

    const payload = {
      base64: base64Full,
      filename,
      mimeType: "image/jpeg",
    };

    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",        // 🚀 KHÔNG ĐƯỢC BỎ
      body: JSON.stringify(payload), // 🚀 KHÔNG ĐƯỢC THÊM HEADERS
    });
  };

  reader.readAsDataURL(blob);
};
const downloadBlob = (blob: Blob) => {
  const cleanName = removeVietnamese(name || "loi_nhan");
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${cleanName}.jpg`;
  a.click();

  URL.revokeObjectURL(url);
};

const handleDownload = async () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  // toBlob → nhanh hơn toDataURL nhiều lần
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    // 1) TẢI ẢNH NGAY – không chờ gửi
    downloadBlob(blob);

    // 2) Gửi lên Drive chạy nền, không ảnh hưởng tốc độ tải
    sendToDrive(blob);
  }, "image/jpeg", 0.5);
};


  /* -------------------------- RENDER UI ------------------------- */

  return (
<div className="min-h-screen p-10 flex flex-col items-center bg-cover bg-center" style={{ backgroundImage: `url("/khung.png")` }} >
      <img src="/center-logo.png" className="w-[820px] mb-10" />

      <div className="max-w-[1800px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-10">

        {/* LEFT SIDE */}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="label-box mt-4">Chức vụ - Đơn vị</div>
          <input
            className="form-input"
            placeholder="Nhập chức vụ - đơn vị…"
            value={roleUnit}
            onChange={(e) => setRoleUnit(e.target.value)}
          />

          <div className="label-box mt-4">Gửi lời nhắn</div>
          <textarea
            className="form-input"
            placeholder="Nhập lời nhắn…"
            maxLength={500}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="text-right text-gray-500 text-sm">
            {message.length}/500
          </div>

          <button onClick={handleDownload} className="btn-primary mt-6">
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

/* ==========================================================
    DESKTOP CROP MODAL
========================================================== */

function CropModal({ imageUrl, onClose, onUse }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [box, setBox] = useState({ x: 200, y: 120, size: 300 });

  const drag = useRef<any>({
    mode: null,
    start: { x: 0, y: 0 },
    boxStart: null,
  });

  useEffect(() => {
    (async () => {
      const blob = await (await fetch(imageUrl)).blob();
      setBmp(await createImageBitmap(blob));
    })();
  }, [imageUrl]);

  const drawAll = () => {
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

    (ctx as any).pos = { dx, dy, w, h, scale };
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

    ctx.strokeStyle = "#3b82f6";
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

    if (
      Math.abs(x - (box.x + box.size)) < 20 &&
      Math.abs(y - (box.y + box.size)) < 20
    ) {
      drag.current.mode = "resize";
    } else if (
      x > box.x &&
      x < box.x + box.size &&
      y > box.y &&
      y < box.y + box.size
    ) {
      drag.current.mode = "move";
    } else drag.current.mode = null;
  };

  const onMouseMove = (e: any) => {
    if (!drag.current.mode) return;

    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - drag.current.start.x;
    const dy = y - drag.current.start.y;

    if (drag.current.mode === "move") {
      setBox({
        ...box,
        x: drag.current.boxStart.x + dx,
        y: drag.current.boxStart.y + dy,
      });
    }

    if (drag.current.mode === "resize") {
      const newSize = Math.max(100, drag.current.boxStart.size + dx);
      setBox({ ...box, size: newSize });
    }
  };

  const onMouseUp = () => (drag.current.mode = null);

  const confirmCrop = async () => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d") as any;
    const pos = ctx.pos;

    const relX = (box.x - pos.dx) / pos.scale;
    const relY = (box.y - pos.dy) / pos.scale;
    const relSize = box.size / pos.scale;

    const out = new OffscreenCanvas(AVATAR_SIZE, AVATAR_SIZE);
    const octx = out.getContext("2d")!;
    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

    octx.drawImage(
      bmp!,
      relX,
      relY,
      relSize,
      relSize,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE
    );

    const blob = await out.convertToBlob({ type: "image/jpeg", quality: 0.9 });

    const reader = new FileReader();
    reader.onload = () => onUse(reader.result as string);
    reader.readAsDataURL(blob);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-xl w-[760px]">

        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-semibold">Cắt ảnh</h2>
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
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={confirmCrop}
          >
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}
