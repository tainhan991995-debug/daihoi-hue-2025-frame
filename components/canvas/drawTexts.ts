// /components/canvas/drawTexts.ts

// JUSTIFY WRAP TEXT (LỜI NHẮN)
export const wrapJustifyText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  if (!text) return;

  const blocks = text.split("\n");

  blocks.forEach((block) => {
    const words = block.split(" ");
    let line = "";
    const lines: string[] = [];

    for (let w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line.trim());
        line = w + " ";
      } else line = test;
    }

    if (line.trim()) lines.push(line.trim());

    lines.forEach((cur, idx) => {
      const isLast = idx === lines.length - 1;

      // last line → left align
      if (isLast) {
        ctx.fillText(cur, x, y);
        y += lineHeight;
        return;
      }

      // justify other lines
      const parts = cur.split(" ");
      const totalWordWidth = parts.reduce(
        (sum, p) => sum + ctx.measureText(p).width,
        0
      );

      const extra = maxWidth - totalWordWidth;
      const spacing = extra / (parts.length - 1);

      let cursor = x;
      parts.forEach((p) => {
        ctx.fillText(p, cursor, y);
        cursor += ctx.measureText(p).width + spacing;
      });

      y += lineHeight;
    });

    y += 15;
  });
};

// CENTER WRAP WITH VERTICAL CENTERING (CHUNG)
export const wrapCenterText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number
) => {
  if (!text) return;

  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  words.forEach((w) => {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line.trim());
      line = w + " ";
    } else line = test;
  });

  if (line.trim()) lines.push(line.trim());

  // vertical center
  const totalHeight = lines.length * lineHeight;
  let y = centerY - totalHeight / 2;

  lines.forEach((l) => {
    ctx.fillText(l, centerX, y);
    y += lineHeight;
  });
};

// CENTER WRAP + STROKE FOR NAME (UTM IMPACT)
export const wrapCenterName = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number
) => {
  if (!text) return;
  ctx.font = `${fontSize}px "UTM Impact"`;

  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  words.forEach((w) => {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line.trim());
      line = w + " ";
    } else line = test;
  });

  if (line.trim()) lines.push(line.trim());

  // vertical center
  const totalHeight = lines.length * lineHeight;
  let y = centerY - totalHeight / 2;

  lines.forEach((l) => {
    ctx.strokeText(l, centerX, y);
    ctx.fillText(l, centerX, y);
    y += lineHeight;
  });
};

// MAIN FUNCTION
export function drawTexts(
  ctx: CanvasRenderingContext2D,
  name: string,
  roleUnit: string,
  message: string,
  config: any
) {
  const {
    NAME_X,
    NAME_Y,
    NAME_MAX_WIDTH,
    WARD_X,
    WARD_Y,
    WARD_WIDTH,
    WARD_LINE_HEIGHT,
    TEXT_X,
    TEXT_Y,
    TEXT_WIDTH,
    TEXT_LINE_HEIGHT,
  } = config;

 // ======================
// HỌ VÀ TÊN — AUTO-FIT 1 DÒNG
// ======================
if (name) {
  let size = 180; // cỡ tối đa
  const text = name.toUpperCase();

  // Thu nhỏ font cho đến khi vừa khung
  while (size > 60) {
    ctx.font = `${size}px "UTM Impact"`;
    if (ctx.measureText(text).width <= NAME_MAX_WIDTH) break;
    size -= 4;
  }

  const lineHeight = size * 0.92;

  // Tăng độ dày viền cho đẹp
  ctx.lineWidth = Math.max(12, Math.round(size * 0.1));
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#FF8A00";
  ctx.textAlign = "center";

  // Vẽ 1 dòng — không wrap
  ctx.strokeText(text, NAME_X, NAME_Y);
  ctx.fillText(text, NAME_X, NAME_Y);
}

  // CHỨC VỤ - ĐƠN VỊ (Times New Roman)
  if (roleUnit) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 95px "Times New Roman"`;

    wrapCenterText(
      ctx,
      roleUnit,
      WARD_X,
      WARD_Y,
      WARD_WIDTH,
      WARD_LINE_HEIGHT
    );
  }

  // LỜI NHẮN
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `italic bold 150px "Times New Roman"`;

  wrapJustifyText(ctx, message, TEXT_X, TEXT_Y, TEXT_WIDTH, TEXT_LINE_HEIGHT);
}
