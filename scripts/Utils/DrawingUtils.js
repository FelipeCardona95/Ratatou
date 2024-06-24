class DrawingUtils {
  constructor(settings) {
    this.settings = settings;
    this.fontSize = "12px";
    this.fontFamily = "Arial";
    this.textColor = "white";
    this.images = [];
  }

  initOurPlayerCanvas(ourPlayerCanvas, context) {
    const centerX = ourPlayerCanvas.width / 2 + 2.5; // Adjust by 0.5 for pixel alignment
    const centerY = ourPlayerCanvas.height / 2 + 2.5; // Adjust by 0.5 for pixel alignment
    console.log(`Canvas center: (${centerX}, ${centerY})`);
    this.drawFilledCircle(context, centerX, centerY, 7, "yellow");
  }

  initGridCanvas(canvasBottom, contextBottom) {
    this.drawBoard(canvasBottom, contextBottom);
  }

  clearGrid(contextBottom, canvasBottom) {
    contextBottom.clearRect(0, 0, canvasBottom.width, canvasBottom.height);
  }

  drawFilledCircle(context, x, y, radius, color) {
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
  }

  initCanvas(canvas, context) {
    // Placeholder for any future initialization logic
  }

  fillCtx(canvasBottom, contextBottom) {
    contextBottom.fillStyle = "#1a1c23";
    contextBottom.fillRect(0, 0, canvasBottom.width, canvasBottom.height);
  }

  drawBoard(canvasBottom, contextBottom) {
    const bw = canvasBottom.width;
    const bh = canvasBottom.height;
    const p = 0;
    const totalSpace = canvasBottom.height / 10;

    for (let x = 0; x <= bw; x += totalSpace) {
      contextBottom.moveTo(0.5 + x + p, p);
      contextBottom.lineTo(0.5 + x + p, bh + p);
    }

    for (let y = 0; y <= bh; y += 50) {
      contextBottom.moveTo(p, 0.5 + y + p);
      contextBottom.lineTo(bw + p, 0.5 + y + p);
    }

    contextBottom.strokeStyle = "grey";
    contextBottom.stroke();
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  drawCustomImage(ctx, x, y, imageName, folder, size) {
    if (!imageName) return;

    const folderR = folder ? `${folder}/` : "";
    const src = `/images/${folderR}${imageName}.png`;

    const preloadedImage = this.settings.GetPreloadedImage(src, folder);

    if (preloadedImage === null) {
      this.drawFilledCircle(ctx, x, y, 10, "#4169E1");
      return;
    }

    if (preloadedImage) {
      ctx.drawImage(preloadedImage, x - size / 2, y - size / 2, size, size);
    } else {
      this.settings.preloadImageAndAddToList(src, folder)
        .then(() => console.log("Item loaded"))
        .catch(() => console.log("Item not loaded"));
    }
  }

  transformPoint(x, y) {
    const angle = -0.785398;
    let newX = x * angle - y * angle;
    let newY = x * angle + y * angle;
    newX *= 4;
    newY *= 4;
    newX += 250;
    newY += 250;
    return { x: newX, y: newY };
  }

  drawText(x, y, text, ctx) {
    ctx.font = `${this.fontSize} ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, x - textWidth / 2, y);
  }

  drawTextItems(x, y, text, ctx, size, color) {
    ctx.font = `${size} ${this.fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}
