export function drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height = width) {
  // 1. CHỈNH ẢNH TO LÊN: Nới rộng khung vẽ ra xung quanh thêm 20px để lấp kín khoảng trắng
  const offset = 20; 
  const drawX = x - offset;
  const drawY = y - offset;
  const drawW = width + offset * 2;
  const drawH = height + offset * 2;

  const scale = Math.max(drawW / img.width, drawH / img.height);
  const sw = drawW / scale, sh = drawH / scale;
  
  ctx.save();
  
  // 2. Cắt bo góc theo khung đã phóng to
  ctx.beginPath();
  ctx.roundRect(drawX, drawY, drawW, drawH, 80);
  ctx.clip(); 
  
  // 3. Vẽ ảnh
  ctx.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, drawX, drawY, drawW, drawH);
  
  ctx.restore();
  
  // 4. VẼ VIỀN MẢNH HƠN
  ctx.beginPath();
  ctx.roundRect(drawX, drawY, drawW, drawH, 80);
  
  // Giảm độ dày nét vẽ xuống còn 15 (thay vì 50 như trước) để viền thanh mảnh, tinh tế hơn
  ctx.lineWidth = 15; 
  ctx.strokeStyle = "#38A1F3"; 
  ctx.stroke();
}
