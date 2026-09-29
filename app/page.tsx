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

const AVATAR_SIZE = 1500;
const AVATAR_X = 680;
const AVATAR_Y = 1485;

const CONFIG = {
  name: { x: 600, y: 2910, width: 1600, height: 215 },
  unit: { x: 550, y: 3220, width: 1750, height: 215 },
  message: { x: 2920, y: 2030, width: 4180, height: 1240 },
};


/* -------------------------------
    MOBILE AUTO CROP
-------------------------------- */
const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

async function autoCropMobile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
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

    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Không đọc được ảnh.")); };
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


const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  let cached = images.get(src);
  if (!cached) {
    cached = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { images.delete(src); reject(new Error("Không tải được ảnh. Vui lòng thử lại.")); };
      img.src = src;
    });
    images.set(src, cached);
  }
  return cached;
}
async function renderImage(canvas: HTMLCanvasElement, width: number, frameUrl: string, avatarUrl: string | null, name: string, unit: string, message: string, cancelled = () => false) {
  const [frame, avatar] = await Promise.all([loadImage(frameUrl), avatarUrl ? loadImage(avatarUrl) : Promise.resolve(null)]);
  if (cancelled()) return;
  canvas.width = width;
  canvas.height = Math.round(width * FRAME_HEIGHT / FRAME_WIDTH);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(width / FRAME_WIDTH, canvas.height / FRAME_HEIGHT);
  ctx.drawImage(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  if (avatar) drawAvatar(ctx, avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE, 1320);
  drawTexts(ctx, name, unit, message, CONFIG);
  
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

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const savingRef = useRef(false);
  const pendingRef = useRef<{ blob: Blob; id: string; name: string; roleUnit: string; message: string } | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (canvasRef.current) renderImage(canvasRef.current, 1510, "/frame-preview.webp", croppedImage, name, roleUnit, message, () => cancelled).catch(error => { if (!cancelled) setSaveStatus(error.message); });
    }, 80);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [croppedImage, name, roleUnit, message]);

  /* -------------------------- FILE PICKER ------------------------- */
  const chooseFile = () =>
    document.getElementById("fileInput")?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (isMobile()) {
      try {
        const croppedBase64 = await autoCropMobile(f);
        setCroppedImage(croppedBase64);
      } catch { setSaveStatus("Không đọc được ảnh. Vui lòng chọn ảnh khác."); }
      return;
    }

    const url = URL.createObjectURL(f);
    setRawImageURL(url);
    setShowCropper(true);
  };

  /* -------------------------- DOWNLOAD + SEND ------------------------- */
  const downloadBlob = (blob: Blob, personName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = removeVietnamese(personName || "loi_nhan") + ".jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const saveAndDownload = async () => {
    const pending = pendingRef.current;
    if (!pending || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setCanRetry(false);
    setSaveStatus("Đã gửi ảnh để tải về. Đang lưu bản sao lên Google…");
    try {
      const form = new FormData();
      form.append("photo", pending.blob, pending.id + ".jpg");
      form.append("id", pending.id);
      form.append("name", pending.name);
      form.append("roleUnit", pending.roleUnit);
      form.append("message", pending.message);
      const response = await fetch("/api/download", { method: "POST", body: form, signal: AbortSignal.timeout(55000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Chưa lưu được ảnh.");

      pendingRef.current = null;
      setSaveStatus("Đã lưu ảnh và thông tin lên Google.");
    } catch (error) {
      setCanRetry(true);
      setSaveStatus(error instanceof Error ? error.message : "Chưa lưu được ảnh. Vui lòng thử lại.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveStatus("Đang chuẩn bị ảnh…");
    const snapshot = { name, roleUnit, message };
    try {
      const exportCanvas = document.createElement("canvas");
      await renderImage(exportCanvas, isMobile() ? 3775 : FRAME_WIDTH, "/frame1.png", croppedImage, name, roleUnit, message);
      const blob = await new Promise<Blob>((resolve, reject) => exportCanvas.toBlob(
        value => value ? resolve(value) : reject(new Error("Không tạo được ảnh.")), "image/jpeg", 0.5));
      if (blob.size > 3 * 1024 * 1024) throw new Error("Ảnh vượt quá 3 MB. Vui lòng chọn ảnh khác.");
      exportCanvas.width = 1; exportCanvas.height = 1;
      pendingRef.current = { blob, id: crypto.randomUUID(), ...snapshot };
      downloadBlob(blob, snapshot.name);
      savingRef.current = false;
      await saveAndDownload();
    } catch (error) {
      savingRef.current = false;
      setSaving(false);
      setSaveStatus(error instanceof Error ? error.message : "Không tạo được ảnh.");
    }
  };

  /* -------------------------- UI ------------------------- */
  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-10 flex flex-col items-center bg-cover bg-center" 
         style={{ backgroundImage: `url("/background-cyan.webp")` }} >

      <img src="/header.webp" alt="Đại hội Đoàn thành phố Huế" fetchPriority="high" className="w-full max-w-[820px] h-auto mb-4 sm:mb-8" />

      <div className="max-w-[1800px] w-full grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-4 lg:gap-10 items-start">

        {/* LEFT SIDE */}
        <div className="bg-white p-4 sm:p-6 lg:p-10 min-w-0 rounded-2xl shadow-xl">
          <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <button className="form-button mb-6" onClick={chooseFile}>
            📷 Chọn ảnh
          </button>

          <div className="label-box">Họ và tên</div>
          <input className="form-input" maxLength={200} placeholder="Nhập họ và tên…" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="label-box mt-4">Chức vụ - Đơn vị</div>
          <input className="form-input" maxLength={300} placeholder="Nhập chức vụ - đơn vị…" value={roleUnit} onChange={(e) => setRoleUnit(e.target.value)} />

          <div className="label-box mt-4">Gửi lời nhắn</div>
          <textarea className="form-input" placeholder="Nhập lời nhắn…" maxLength={500} rows={6} 
                    value={message} onChange={(e) => setMessage(e.target.value)} />

          <div className="text-right text-gray-500 text-sm">{message.length}/500</div>

          <button onClick={handleDownload} disabled={saving} className="btn-primary mt-6 disabled:opacity-50">
            {saving ? "Đang lưu…" : "Tải lời nhắn về"}
          </button>
          <p role="status" aria-live="polite" className="mt-3 text-sm">{saveStatus}</p>
          {canRetry && <button onClick={saveAndDownload} disabled={saving} className="form-button mt-3">Thử lưu lại</button>}
        </div>

        {/* CANVAS */}
        <div className="flex justify-center min-w-0 w-full">
          <canvas ref={canvasRef} className="rounded-xl shadow-xl" 
                  style={{ width: "100%", height: "auto", aspectRatio: "7550 / 3980" }} />
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
            URL.revokeObjectURL(rawImageURL);
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
