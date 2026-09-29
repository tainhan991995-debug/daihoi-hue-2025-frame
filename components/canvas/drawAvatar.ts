export function drawAvatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height = width) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale, sh = height / scale;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 80);
  ctx.clip();
  ctx.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, x, y, width, height);
  ctx.restore();
  ctx.beginPath();
}
