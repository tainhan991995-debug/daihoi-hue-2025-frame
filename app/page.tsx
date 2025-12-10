"use client";

import React, { useEffect, useRef, useState } from "react";
import "./form.css";
import "./cropper.css";

import { drawAvatar } from "@/components/canvas/drawAvatar";
import { drawTexts } from "@/components/canvas/drawTexts";
import { drawWatermark } from "@/components/canvas/drawLogos";

/* ---------- Constants ---------- */
const FRAME_WIDTH = 7550;
const FRAME_HEIGHT = 3980;

const AVATAR_SIZE = 1450;
const AVATAR_X = 1450 - AVATAR_SIZE / 2;
const AVATAR_Y = 1290 - 118;

// <-- Your current working Apps Script web app URL (use the one you confirmed)
const API_URL =
  "https://script.google.com/macros/s/AKfycbzaDm_i5BE6qYHaMaKGEmOyiUzC1Q3Mbr9MtvCC_ilx2MEVSY66tKaBJWp7_O4tmRxF/exec";

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

/* ---------- Page Component ---------- */
export default function Page() {
  const [rawImageURL, setRawImageURL] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [roleUnit, setRoleUnit] = useState("");
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* =========== Draw Frame =========== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // use logical size for final export
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
        avatar.onload = () => {
          drawAvatar(ctx, avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE);
          drawContent();
        };
      } else drawContent();
    };
  }, [croppedImage, name, roleUnit, message]);

  const chooseFile = () => document.getElementById("fileInput")?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // warm decode
    try {
      await createImageBitmap(f);
    } catch (err) {
      // ignore if not supported
    }
    const url = URL.createObjectURL(f);
    setRawImageURL(url);
    setShowCropper(true);
  };

  /* =========== Send to Google Sheet =========== */
  const sendToGoogleSheet = async (base64Image: string) => {
    const payload = {
      name,
      roleUnit,
      base64Image,
      userAgent: navigator.userAgent,
    };

    console.log("=== SENDING TO GOOGLE SHEET ===");
    console.log("Payload:", payload);

    try {
      // keep "no-cors" because Apps Script may require it; we just fire-and-forget.
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Đã gửi xong → API (no-cors không đọc được response)");
    } catch (err) {
      console.error("Gửi Google Sheet lỗi:", err);
    }
  };

  /* =========== Download (export) =========== */
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // export PNG from high-res canvas
    const base64 = canvas.toDataURL("image/png");

    // send copy to Google Sheet (or Drive via GAS)
    sendToGoogleSheet(base64);

    // trigger client download
    const a = document.createElement("a");
    a.href = base64;
    a.download = "loi-nhan.png";
    a.click();
  };

  /* =========== Render =========== */
  return (
    <div className="min-h-screen p-6 sm:p-10 bg-[#cfe4ff] flex flex-col items-center">
      <img src="/center-logo.png" className="w-[420px] sm:w-[820px] mb-8" />

      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-6">
        {/* LEFT */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <button className="form-button mb-4" onClick={chooseFile}>
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

          <button onClick={downloadImage} className="btn-primary mt-4 w-full">
            Tải lời nhắn về
          </button>
        </div>

        {/* CANVAS */}
        <div className="flex justify-center items-center">
          <div className="w-full">
            <canvas
              ref={canvasRef}
              className="rounded-xl shadow-xl w-full"
              style={{ width: "100%", aspectRatio: "7550 / 3980" }}
            />
          </div>
        </div>
      </div>

      {/* CROP MODAL */}
      {showCropper && rawImageURL && (
        <CropModal
          imageUrl={rawImageURL}
          onClose={() => {
            // free object url
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

/* =========================== CropModal (mobile-friendly + performant) =========================== */

type CropModalProps = {
  imageUrl: string;
  onClose: () => void;
  onUse: (img: string) => void;
};

function CropModal({ imageUrl, onClose, onUse }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  // box in CSS pixels relative to canvas client size
  const [box, setBox] = useState({ x: 60, y: 60, size: 220 });

  const drag = useRef<{
    mode: "move" | "resize" | null;
    start: { x: number; y: number };
    boxStart: { x: number; y: number; size: number } | null;
  }>({ mode: null, start: { x: 0, y: 0 }, boxStart: null });

  // animate redraw only during interaction
  const animRef = useRef<number | null>(null);
  const needRedraw = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const bitmap = await createImageBitmap(blob);
        if (mounted) setBmp(bitmap);
      } catch (err) {
        console.error("load image failed", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [imageUrl]);

  /* ---------- Helper: sync canvas sizes to client (DPR-aware) ---------- */
  const syncCanvasSize = (cv: HTMLCanvasElement, useDevicePixel = true) => {
    const rect = cv.getBoundingClientRect();
    const dpr = useDevicePixel ? Math.max(1, window.devicePixelRatio || 1) : 1;
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    cv.width = Math.floor(w * dpr);
    cv.height = Math.floor(h * dpr);
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;
    return { clientW: w, clientH: h, dpr };
  };

  /* ---------- Draw functions ---------- */
  const drawAll = () => {
    if (!bmp || !canvasRef.current || !overlayRef.current) return;

    const cv = canvasRef.current;
    const ov = overlayRef.current;

    const { clientW, clientH, dpr } = syncCanvasSize(cv);
    syncCanvasSize(ov, false); // overlay use CSS pixels for drawing overlay

    // draw image scaled to fit inside canvas (centered)
    const ctx = cv.getContext("2d")!;
    ctx.save();
    ctx.clearRect(0, 0, cv.width, cv.height);

    const scale = Math.min(cv.width / dpr / bmp.width, cv.height / dpr / bmp.height);
    const drawW = bmp.width * scale;
    const drawH = bmp.height * scale;
    const dx = (clientW - drawW) / 2;
    const dy = (clientH - drawH) / 2;

    // since canvas is high-res, scale coords by dpr when drawing actual image
    ctx.drawImage(bmp, dx * dpr, dy * dpr, drawW * dpr, drawH * dpr);
    ctx.restore();

    // draw overlay (CSS pixel canvas)
    const octx = ov.getContext("2d")!;
    const ow = ov.width;
    const oh = ov.height;
    octx.clearRect(0, 0, ow, oh);

    // dim background
    octx.fillStyle = "rgba(0,0,0,0.55)";
    octx.fillRect(0, 0, ow, oh);

    // hole
    octx.clearRect(box.x, box.y, box.size, box.size);

    // stroke
    octx.strokeStyle = "#3b82f6";
    octx.lineWidth = 3;
    octx.strokeRect(box.x + 1.5, box.y + 1.5, box.size - 3, box.size - 3);
  };

  /* ---------- Animation loop to reduce chattiness ---------- */
  const scheduleDraw = () => {
    if (animRef.current != null) return;
    animRef.current = requestAnimationFrame(() => {
      drawAll();
      animRef.current = null;
    });
  };

  useEffect(() => {
    // initial draw when bmp or box changes
    scheduleDraw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmp, box.x, box.y, box.size]);

  /* ---------- Input position helper (unify mouse & touch) ---------- */
  const getPointer = (e: MouseEvent | TouchEvent) => {
    const ov = overlayRef.current!;
    const rect = ov.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    } else {
      const me = e as MouseEvent;
      return { x: me.clientX - rect.left, y: me.clientY - rect.top };
    }
  };

  /* ---------- Handlers ---------- */
  const startDrag = (mode: "move" | "resize" | null, px: number, py: number) => {
    drag.current.mode = mode;
    drag.current.start = { x: px, y: py };
    drag.current.boxStart = { ...box };
  };

  const handlePointerStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPointer((e as unknown) as any);
    // determine region: near bottom-right corner -> resize, inside -> move
    const nearCorner =
      Math.abs(p.x - (box.x + box.size)) < 30 &&
      Math.abs(p.y - (box.y + box.size)) < 30;
    const inside =
      p.x > box.x && p.x < box.x + box.size && p.y > box.y && p.y < box.y + box.size;

    if (nearCorner) startDrag("resize", p.x, p.y);
    else if (inside) startDrag("move", p.x, p.y);
    else drag.current.mode = null;
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drag.current.mode) return;
    const p = getPointer((e as unknown) as any);
    const dx = p.x - drag.current.start.x;
    const dy = p.y - drag.current.start.y;
    const boxStart = drag.current.boxStart!;
    if (drag.current.mode === "move") {
      setBox((b) => {
        const nx = boxStart.x + dx;
        const ny = boxStart.y + dy;
        // clamp inside overlay
        const ov = overlayRef.current!;
        const maxX = ov.width - boxStart.size;
        const maxY = ov.height - boxStart.size;
        return {
          x: Math.max(0, Math.min(nx, maxX)),
          y: Math.max(0, Math.min(ny, maxY)),
          size: boxStart.size,
        };
      });
    } else if (drag.current.mode === "resize") {
      setBox((b) => {
        const newSize = Math.max(80, Math.floor(boxStart.size + dx));
        const ov = overlayRef.current!;
        const maxSize = Math.min(ov.width - boxStart.x, ov.height - boxStart.y);
        return {
          x: boxStart.x,
          y: boxStart.y,
          size: Math.max(80, Math.min(newSize, maxSize)),
        };
      });
    }
  };

  const handlePointerEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    drag.current.mode = null;
    drag.current.boxStart = null;
  };

  /* ---------- Confirm crop: compute real image coords and export PNG ---------- */
  const confirmCrop = async () => {
    if (!bmp || !canvasRef.current || !overlayRef.current) return;

    // compute mapping used in drawAll
    const cv = canvasRef.current;
    const ov = overlayRef.current;
    const clientW = cv.getBoundingClientRect().width;
    const clientH = cv.getBoundingClientRect().height;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const scale = Math.min((cv.width / dpr) / bmp.width, (cv.height / dpr) / bmp.height);
    const drawW = bmp.width * scale;
    const drawH = bmp.height * scale;
    const dx = (clientW - drawW) / 2;
    const dy = (clientH - drawH) / 2;

    // box (CSS pixels) -> relative to image logical pixels
    const relX = (box.x - dx) / scale;
    const relY = (box.y - dy) / scale;
    const relSize = box.size / scale;

    // create temporary canvas at avatar size for consistent export
    const off = document.createElement("canvas");
    off.width = AVATAR_SIZE;
    off.height = AVATAR_SIZE;
    const octx = off.getContext("2d")!;
    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, off.width, off.height);

    // draw the selected portion from bmp (use bmp as source)
    octx.drawImage(
      // source
      (bmp as any),
      relX,
      relY,
      relSize,
      relSize,
      // dest
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE
    );

    // to dataURL
    const url = off.toDataURL("image/png");
    onUse(url);
  };

  /* ---------- UI: attach both mouse and touch events ---------- */
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;

    // mouse
    const mDown = (e: MouseEvent) => handlePointerStart((e as unknown) as any);
    const mMove = (e: MouseEvent) => handlePointerMove((e as unknown) as any);
    const mUp = () => handlePointerEnd();

    // touch
    const tStart = (e: TouchEvent) => handlePointerStart((e as unknown) as any);
    const tMove = (e: TouchEvent) => {
      handlePointerMove((e as unknown) as any);
    };
    const tEnd = () => handlePointerEnd();

    ov.addEventListener("mousedown", mDown);
    window.addEventListener("mousemove", mMove);
    window.addEventListener("mouseup", mUp);

    ov.addEventListener("touchstart", tStart, { passive: false });
    window.addEventListener("touchmove", tMove, { passive: false });
    window.addEventListener("touchend", tEnd);

    return () => {
      ov.removeEventListener("mousedown", mDown);
      window.removeEventListener("mousemove", mMove);
      window.removeEventListener("mouseup", mUp);

      ov.removeEventListener("touchstart", tStart);
      window.removeEventListener("touchmove", tMove);
      window.removeEventListener("touchend", tEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  /* ---------- Ensure overlay initial sizing when mounted ---------- */
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    // set overlay canvas CSS pixel size and initial box to center
    const rect = ov.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    ov.width = w;
    ov.height = h;

    // center box
    const s = Math.min( Math.floor(Math.min(w, h) * 0.6), 320 );
    setBox({ x: Math.floor((w - s) / 2), y: Math.floor((h - s) / 2), size: s });

    // initial draw
    scheduleDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-[920px] mx-auto"
        style={{ maxHeight: "92vh" }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Cắt ảnh</h3>
          <button className="p-1" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="p-3">
          <div
            className="relative w-full h-[60vh] bg-black rounded"
            style={{ touchAction: "none" }}
          >
            {/* image canvas (hi-res) */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: "block", width: "100%", height: "100%" }}
            />
            {/* overlay canvas (CSS pixel coords) */}
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => {
                onClose();
              }}
            >
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
    </div>
  );
}
