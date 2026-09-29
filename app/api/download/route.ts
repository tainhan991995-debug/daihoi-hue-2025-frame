import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_UPLOAD_SECRET;
  if (!url || !secret) return NextResponse.json({ error: "Chưa cấu hình lưu Google Drive." }, { status: 503 });
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  try {
    if (Number(request.headers.get("content-length")) > MAX_BYTES + 16000) throw new Error("Ảnh quá lớn.");
    const form = await request.formData();
    const photo = form.get("photo");
    const id = String(form.get("id") || "");
    const name = String(form.get("name") || "").trim();
    const roleUnit = String(form.get("roleUnit") || "").trim();
    const message = String(form.get("message") || "").trim();
    if (!(photo instanceof File) || photo.type !== "image/jpeg" || photo.size > MAX_BYTES || photo.size < 3 || !/^[a-f0-9-]{36}$/i.test(id) || name.length > 200 || roleUnit.length > 300 || message.length > 500) {
      return NextResponse.json({ error: "Thông tin hoặc ảnh không hợp lệ (ảnh tối đa 3 MB)." }, { status: 400 });
    }
    const bytes = Buffer.from(await photo.arrayBuffer());
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw new Error("Ảnh không hợp lệ.");
    const response = await fetch(url, {
      method: "POST", redirect: "follow", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, id, name, roleUnit, message, base64: bytes.toString("base64") }),
      signal: AbortSignal.timeout(45000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error("Google chưa xác nhận lưu.");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chưa xác nhận lưu được lên Google. Bạn hãy thử lại." }, { status: 502 });
  }
}
