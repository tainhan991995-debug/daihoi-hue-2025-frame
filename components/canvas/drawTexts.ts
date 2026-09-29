export type TextBox = { x: number; y: number; width: number; height: number };
export type TextLayout = { name: TextBox; unit: TextBox; message: TextBox };

// Wrap long words as well as ordinary sentences; retain explicit newlines.
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      // Array.from preserves Unicode code points, including emoji pairs.
      for (const letter of Array.from(word)) {
        if (line && ctx.measureText(line + letter).width > width) {
          lines.push(line); line = "";
        }
        line += letter;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function fitText(ctx: CanvasRenderingContext2D, text: string, box: TextBox, maxSize: number, font: string, singleLine = false) {
  let result = { size: 1, lines: [text], lineHeight: 1.4 };
  // No fixed minimum size: even maximum-length input must remain in its box.
  for (let size = maxSize; size >= 1; size--) {
    ctx.font = `${font} ${size}px "Times New Roman", serif`;
    const lines = singleLine ? [text.replace(/\s+/g, " ").trim()] : wrapLines(ctx, text, box.width);
    const lineHeight = size * 1.4;
    result = { size, lines, lineHeight };
    if (lines.length * lineHeight <= box.height && lines.every(line => ctx.measureText(line).width <= box.width)) break;
  }
  return result;
}

function drawInBox(ctx: CanvasRenderingContext2D, text: string, box: TextBox, maxSize: number, font: string, color: string, centered: boolean, singleLine = false) {
  if (!text.trim()) return;
  ctx.save();
  const fit = fitText(ctx, text, box, maxSize, font, singleLine);
  ctx.beginPath(); ctx.rect(box.x, box.y, box.width, box.height); ctx.clip();
  ctx.fillStyle = color;
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "alphabetic";
  const top = centered ? box.y + (box.height - fit.lines.length * fit.lineHeight) / 2 : box.y;
  fit.lines.forEach((line, index) => {
    const metrics = ctx.measureText(line || "Ág");
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    const baseline = top + index * fit.lineHeight + (fit.lineHeight - ascent - descent) / 2 + ascent;
    ctx.fillText(line, centered ? box.x + box.width / 2 : box.x, baseline);
  });
  ctx.restore();
}

export function drawTexts(ctx: CanvasRenderingContext2D, name: string, roleUnit: string, message: string, config: TextLayout) {
  drawInBox(ctx, name.toUpperCase(), config.name, 160, "bold", "#ffffff", true, true);
  drawInBox(ctx, roleUnit, config.unit, 95, "bold", "#ffffff", true);
  drawInBox(ctx, message, config.message, 150, "italic bold", "#0755a6", false);
}
