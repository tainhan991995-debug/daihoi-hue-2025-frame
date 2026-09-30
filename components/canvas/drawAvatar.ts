export function drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height = width) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale, sh = height / scale;
  
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 80); // 80 là độ bo góc hiện tại
  
  ctx.clip(); // Cắt khung hình thành chữ nhật bo góc
  ctx.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, x, y, width, height);
  
  // --- THÊM VIỀN TẠI ĐÂY ---
  // Lưu ý: Vì đã dùng lệnh clip() ở trên nên phần viền tràn ra ngoài sẽ bị cắt đi một nửa. 
  // Do đó, nếu bạn muốn viền dày 15px, hãy nhập số 30.
  ctx.lineWidth = 30; 
  
  // Bạn có thể đổi màu viền ở đây. 
  // "#F26522" là màu cam (giống ô bạn khoanh). 
  // Nếu muốn màu xanh dương cho hợp với màu ruy-băng bên dưới, hãy đổi thành "#0D62B8".
  ctx.strokeStyle = "#F26522"; 
  ctx.stroke();
  // -------------------------

  ctx.restore();
}
