// drawLogos.ts
export function drawWatermark(ctx, text, x, y) {
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `italic 70px "Times New Roman"`;
  ctx.textAlign = "right";
  ctx.fillText(text, x, y);
}

export function drawCenterLogo(ctx, callback) {
  const logo = new Image();
  logo.src = "/center-logo.png";
  logo.onload = () => {
    const w = 1200, h = 1200;
    const x = 7550 / 2 - w / 2;
    const y = 3980 / 2 - h / 2 + 300;
    ctx.globalAlpha = 0.13;
    ctx.drawImage(logo, x, y, w, h);
    ctx.globalAlpha = 1;
    callback();
  };
}

export function drawHeaderLogo(ctx) {
  const logo = new Image();
  logo.src = "/center-logo.png";
  logo.onload = () => {
    ctx.drawImage(logo, 0, 0, 7550, 600);
  };
}
