export class ChestsDrawing extends DrawingUtils {
  constructor(Settings) {
    super(Settings);
  }

  interpolate(chests, lpX, lpY, t) {
    for (const chest of chests) {
      const hX = -1 * chest.posX + lpX;
      const hY = chest.posY - lpY;

      if (chest.hX === 0 && chest.hY === 0) {
        chest.hX = hX;
        chest.hY = hY;
      }

      chest.hX = this.lerp(chest.hX, hX, t);
      chest.hY = this.lerp(chest.hY, hY, t);
    }
  }

  invalidate(ctx, chests) {
    const colorMapping = {
      standard: "green",
      green: "green",
      uncommon: "blue",
      blue: "blue",
      rare: "purple",
      purple: "purple",
      legendary: "yellow",
      yellow: "yellow",
    };

    for (const chest of chests) {
      const point = this.transformPoint(chest.hX, chest.hY);
      const chestNameLower = chest.chestName.toLowerCase();

      for (const [key, color] of Object.entries(colorMapping)) {
        if (chestNameLower.includes(key)) {
          this.DrawCustomImage(ctx, point.x, point.y, color, "Resources", 50);
          break;
        }
      }
    }
  }
}
