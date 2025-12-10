// drawAvatar.ts
export function drawCenterCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
) {
  const ratio = img.width / img.height;
  const crop = ratio > 1 ? img.height : img.width;
  const sx = (img.width - crop) / 2;
  const sy = (img.height - crop) / 2;
  ctx.drawImage(img, sx, sy, crop, crop, x, y, size, size);
}

export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  AVATAR_X: number,
  AVATAR_Y: number,
  AVATAR_SIZE: number
) {
  const r = 80;
  ctx.save();
  ctx.shadowColor = "rgba(102,178,255,0.8)";
  ctx.shadowBlur = 140;
  ctx.strokeStyle = "rgba(102,178,255,1)";
  ctx.lineWidth = 50;
  ctx.roundRect(AVATAR_X, AVATAR_Y, AVATAR_SIZE, AVATAR_SIZE, r);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.roundRect(AVATAR_X, AVATAR_Y, AVATAR_SIZE, AVATAR_SIZE, r);
  ctx.clip();
  drawCenterCrop(ctx, img, AVATAR_X, AVATAR_Y, AVATAR_SIZE);
  ctx.restore();
}
