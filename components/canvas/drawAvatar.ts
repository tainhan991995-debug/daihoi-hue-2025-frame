export function drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height = width) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale, sh = height / scale;
  
  // Lưu trạng thái trước khi cắt
  ctx.save();
  
  // 1. Tạo hình chữ nhật bo góc để cắt ảnh
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 80); // Độ bo góc 80
  ctx.clip(); // Bắt đầu cắt
  
  // 2. Vẽ ảnh vào bên trong
  ctx.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, x, y, width, height);
  
  // 3. Phục hồi trạng thái (Thoát khỏi lệnh cắt clip)
  // Bước này rất quan trọng để viền không bị cắt đi một nửa, giúp nó tràn ra ngoài lấp màu trắng.
  ctx.restore();
  
  // 4. Vẽ viền bo đè lên mép ảnh và mép khung trắng
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 80);
  
  // Tăng độ dày lên để lấp kín khoảng trắng (bạn có thể tăng lên 60, 80 nếu khoảng trắng vẫn còn)
  ctx.lineWidth = 50; 
  
  // Mã màu xanh dương tiệp với màu bo của khung. 
  // (Nếu thích màu xanh đậm hơn giống nền web, bạn đổi thành "#0782C5")
  ctx.strokeStyle = "#38A1F3"; 
  
  ctx.stroke();
}
