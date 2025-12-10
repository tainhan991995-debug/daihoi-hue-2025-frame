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
   ======================= CROP MODAL ====================
   ========== Square crop fixed, centered on viewport =====
   ====================================================== */

function CropModal({ imageUrl, onClose, onUse }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // drawing image
  const overlayRef = useRef<HTMLCanvasElement | null>(null); // overlay + crop box visuals

  const [imgBitmap, setImgBitmap] = useState<ImageBitmap | null>(null);

  // Square crop box state (position and size in overlay coords)
  const [box, setBox] = useState<{ x: number; y: number; size: number }>({
    x: 0,
    y: 0,
    size: 200,
  });

  const dragging = useRef<{ mode: "move" | "resize" | null; startX: number; startY: number; startBox: any }>({
    mode: null,
    startX: 0,
    startY: 0,
    startBox: null,
  });

  // When opening modal: load bitmap, initialize box centered, and small on mobile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();

        // createImageBitmap is performant and tends to respect orientation better in modern browsers
        const bitmap = await createImageBitmap(blob);
        if (!cancelled) setImgBitmap(bitmap);
      } catch (err) {
        console.error("Load image error:", err);
      }
    })();

    return () => {
      cancelled = true;
      setImgBitmap(null);
    };
  }, [imageUrl]);

  // Draw image scaled into canvas & overlay, set initial centered square
  const drawAll = () => {
    const cv = canvasRef.current;
    const ov = overlayRef.current;
    const bmp = imgBitmap;
    if (!cv || !ov || !bmp) return;

    // set physical size to match CSS layout
    cv.width = cv.clientWidth;
    cv.height = cv.clientHeight;
    ov.width = ov.clientWidth;
    ov.height = ov.clientHeight;

    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Fit image into the canvas (contain)
    const scale = Math.min(cv.width / bmp.width, cv.height / bmp.height);
    const drawW = bmp.width * scale;
    const drawH = bmp.height * scale;
    const dx = (cv.width - drawW) / 2;
    const dy = (cv.height - drawH) / 2;

    // store pos for crop calculations
    (ctx as any).pos = { dx, dy, drawW, drawH, scale };

    ctx.drawImage(bmp, dx, dy, drawW, drawH);

    // If box is default 0 -> init center box
    if (box.size === 0 || (box.x === 0 && box.y === 0 && box.size === 200)) {
      // size should be a fraction of the smaller side
      const maxSide = Math.min(cv.width, cv.height);
      const targetSize = Math.floor(maxSide * (window.innerWidth < 768 ? 0.45 : 0.55));
      setBox({
        x: Math.floor((cv.width - targetSize) / 2),
        y: Math.floor((cv.height - targetSize) / 2),
        size: targetSize,
      });
    }

    drawOverlay();
  };

  const drawOverlay = () => {
    const ov = overlayRef.current;
    const cv = canvasRef.current;
    const bmp = imgBitmap;
    if (!ov || !cv || !bmp) return;

    const ctx = ov.getContext("2d")!;
    ov.width = ov.clientWidth;
    ov.height = ov.clientHeight;
    ctx.clearRect(0, 0, ov.width, ov.height);

    // darken whole area
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, ov.width, ov.height);

    // clear crop square
    ctx.clearRect(box.x, box.y, box.size, box.size);

    // stroke
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 4;
    ctx.strokeRect(box.x + 1.5, box.y + 1.5, box.size - 3, box.size - 3);
  };

  // redraw when bitmap or box changes or on resize
  useEffect(() => {
    drawAll();
    // re-draw on window resize (keeps box centered)
    const onResize = () => {
      // small debounce-ish
      setTimeout(() => {
        drawAll();
      }, 50);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgBitmap, box.x, box.y, box.size]);

  /* ===== pointer / touch handling (supports mouse & touch via pointer events) ===== */
  const startPointer = (clientX: number, clientY: number) => {
    const ov = overlayRef.current!;
    const rect = ov.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // decide mode: near bottom-right corner -> resize, inside box -> move, else none
    const nearCorner = Math.hypot(x - (box.x + box.size), y - (box.y + box.size)) < 28;
    const inside = x > box.x && x < box.x + box.size && y > box.y && y < box.y + box.size;

    if (nearCorner) dragging.current.mode = "resize";
    else if (inside) dragging.current.mode = "move";
    else dragging.current.mode = null;

    dragging.current.startX = x;
    dragging.current.startY = y;
    dragging.current.startBox = { ...box };
  };

  const onPointerDown = (e: any) => {
    // support touch events (touches[0]) and pointer events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPointer(clientX, clientY);
    // prevent default to avoid page scroll on touch
    e.preventDefault?.();
  };

  const onPointerMove = (e: any) => {
    if (!dragging.current.mode) return;
    const ov = overlayRef.current!;
    const rect = ov.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const dx = x - dragging.current.startX;
    const dy = y - dragging.current.startY;

    if (dragging.current.mode === "move") {
      let nx = dragging.current.startBox.x + dx;
      let ny = dragging.current.startBox.y + dy;

      // clamp to overlay bounds
      nx = Math.max(0, Math.min(nx, ov.width - box.size));
      ny = Math.max(0, Math.min(ny, ov.height - box.size));

      setBox((b) => ({ ...b, x: nx, y: ny }));
    } else if (dragging.current.mode === "resize") {
      // only increase size by dx (square)
      let newSize = Math.max(80, dragging.current.startBox.size + dx);
      // clamp
      newSize = Math.min(newSize, Math.min(ov.width - dragging.current.startBox.x, ov.height - dragging.current.startBox.y));
      // Also ensure box remains within bounds when resizing from corner
      setBox((b) => ({ ...b, size: newSize }));
    }
    e.preventDefault?.();
  };

  const onPointerUp = () => {
    dragging.current.mode = null;
    dragging.current.startBox = null;
  };

  // attach pointer/touch/mouse listeners on overlay container
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;

    // pointer events if available (covers mouse & touch on modern browsers)
    ov.addEventListener("pointerdown", (ev) => {
      // only left mouse button or touch
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      startPointer(ev.clientX, ev.clientY);
      (ov as any).setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
    });

    const ptrMove = (ev: PointerEvent) => {
      if (!dragging.current.mode) return;
      onPointerMove(ev);
    };
    const ptrUp = (ev: PointerEvent) => onPointerUp();

    window.addEventListener("pointermove", ptrMove, { passive: false });
    window.addEventListener("pointerup", ptrUp);

    // fallback touch handlers (some older webviews)
    ov.addEventListener("touchstart", onPointerDown, { passive: false });
    ov.addEventListener("touchmove", onPointerMove, { passive: false });
    ov.addEventListener("touchend", onPointerUp);

    // mouse fallback
    ov.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      onPointerDown(e);
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging.current.mode) return;
      onPointerMove(e);
    });
    window.addEventListener("mouseup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", ptrMove);
      window.removeEventListener("pointerup", ptrUp);
      ov.removeEventListener("touchstart", onPointerDown);
      ov.removeEventListener("touchmove", onPointerMove);
      ov.removeEventListener("touchend", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, imgBitmap]);

  /* CONFIRM CROP: convert overlay box -> image coords and output base64
     We will scale down output on mobile for speed.
  */
  const confirmCrop = async () => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d") as any;
    const pos = ctx.pos; // {dx, dy, drawW, drawH, scale}
    const bmp = imgBitmap!;
    if (!pos || !bmp) {
      console.error("Canvas pos or bitmap missing");
      return;
    }

    // Compute relative positions on original image (bitmap)
    const relX = (box.x - pos.dx) / pos.scale;
    const relY = (box.y - pos.dy) / pos.scale;
    const relSize = box.size / pos.scale;

    // On mobile, reduce output resolution to speed up
    const isMobile = window.innerWidth < 768;
    const outSize = isMobile ? AVATAR_SIZE_MOBILE : AVATAR_SIZE_DESKTOP;

    // Create an offscreen canvas (or normal canvas if Offscreen not available)
    const off = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(outSize, outSize) : document.createElement("canvas");
    if (!(off as OffscreenCanvas).getContext) {
      // convert to HTMLCanvasElement
      (off as HTMLCanvasElement).width = outSize;
      (off as HTMLCanvasElement).height = outSize;
    } else {
      (off as OffscreenCanvas).width = outSize;
      (off as OffscreenCanvas).height = outSize;
    }
    const octx = (off as any).getContext("2d")! as CanvasRenderingContext2D;

    // White background to avoid transparent edges
    octx.fillStyle = "#fff";
    octx.fillRect(0, 0, outSize, outSize);

    // Draw the correct slice from original bitmap into the output canvas
    // Note: use drawImage with source coordinates in original bitmap pixels
    octx.drawImage(bmp, relX, relY, relSize, relSize, 0, 0, outSize, outSize);

    // Convert to blob
    let blob: Blob;
    if ((off as OffscreenCanvas).convertToBlob) {
      blob = await (off as OffscreenCanvas).convertToBlob({ type: "image/png", quality: 0.9 });
    } else {
      blob = await new Promise<Blob>((resolve) => {
        (off as HTMLCanvasElement).toBlob((b) => resolve(b as Blob), "image/png", 0.9);
      });
    }

    // Create base64 data url
    const url = await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });

    onUse(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 rounded-xl max-w-[95vw] w-[760px]">
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-semibold">Cắt ảnh</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div
          className="relative w-full h-[480px] bg-black rounded overflow-hidden"
          style={{ touchAction: "none" }}
        >
          <canvas ref={canvasRef} className="absolute w-full h-full" />
          <canvas
            ref={overlayRef}
            className="absolute w-full h-full"
            // using pointer/touch events from useEffect attachments
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
