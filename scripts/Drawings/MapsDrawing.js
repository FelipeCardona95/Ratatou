export class MapDrawing extends DrawingUtils {
  constructor(Settings) {
    super(Settings);
  }

  interpolate(curr_map, lpX, lpY, t) {
    const hX = lpX;
    const hY = -lpY;

    curr_map.hX = this.lerp(curr_map.hX, hX, t);
    curr_map.hY = this.lerp(curr_map.hY, hY, t);
  }

  Draw(ctx, curr_map) {
    if (curr_map.id < 0) return;

    const scaleFactor = 4;
    this.DrawImageMap(
      ctx,
      curr_map.hX * scaleFactor,
      curr_map.hY * scaleFactor,
      curr_map.id.toString(),
      825 * scaleFactor,
      curr_map,
    );
  }

  DrawImageMap(ctx, x, y, imageName, size, curr_map) {
    const mapBackgroundColor = "#1a1c23";
    const rotationAngle = -0.785398; // -45 degrees in radians

    // Fill background to prevent glitch textures
    ctx.fillStyle = mapBackgroundColor;
    ctx.fillRect(0, 0, ctx.width, ctx.height);

    if (!this.settings.showMapBackground) return;
    if (!imageName) return;

    const src = `/images/Maps/${imageName}.png`;
    const preloadedImage = this.settings.GetPreloadedImage(src, "Maps");

    if (preloadedImage) {
      ctx.save();

      ctx.scale(1, -1);
      ctx.translate(250, -250);
      ctx.rotate(rotationAngle);
      ctx.translate(-x, y);
      ctx.drawImage(preloadedImage, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      this.settings
        .preloadImageAndAddToList(src, "Maps")
        .then(() => console.log("Map loaded"))
        .catch(() => console.log("Map not loaded"));
    }
  }
}
