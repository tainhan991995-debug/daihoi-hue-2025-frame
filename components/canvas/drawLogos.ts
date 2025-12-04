// drawLogos.ts

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
) {
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `italic 70px "Times New Roman"`;
  ctx.textAlign = "right";
  ctx.fillText(text, x, y);
}
