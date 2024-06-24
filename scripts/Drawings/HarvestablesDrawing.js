export class HarvestablesDrawing extends DrawingUtils {
  constructor(Settings) {
    super(Settings);
  }

  interpolate(harvestables, lpX, lpY, t) {
    for (const harvestable of harvestables) {
      const hX = -1 * harvestable.posX + lpX;
      const hY = harvestable.posY - lpY;

      if (harvestable.hX === 0 && harvestable.hY === 0) {
        harvestable.hX = hX;
        harvestable.hY = hY;
      }

      harvestable.hX = this.lerp(harvestable.hX, hX, t);
      harvestable.hY = this.lerp(harvestable.hY, hY, t);
    }
  }

  invalidate(ctx, harvestables) {
    const typeMapping = {
      fiber: [11, 14, 38, 42],
      logs: [0, 5, 28, 32],
      rock: [6, 10, 33, 37],
      hide: [15, 22, 43, 47],
      ore: [23, 27, 48, 52],
    };

    const getTypeKey = (type) => {
      for (const [key, range] of Object.entries(typeMapping)) {
        if (
          (type >= range[0] && type <= range[1]) ||
          (type >= range[2] && type <= range[3])
        ) {
          return key;
        }
      }
      return undefined;
    };

    for (const harvestable of harvestables) {
      if (harvestable.size <= 0) continue;

      const typeKey = getTypeKey(harvestable.type);
      if (!typeKey) continue;

      const draw =
        `${typeKey}_${harvestable.tier}_${harvestable.charges}`;

      const point = this.transformPoint(harvestable.hX, harvestable.hY);

      this.DrawCustomImage(ctx, point.x, point.y, draw, "Resources", 50);

      if (this.settings.livingResourcesID) {
        this.drawText(point.x, point.y + 20, harvestable.type.toString(), ctx);
      }

      if (this.settings.resourceSize) {
        this.drawText(point.x, point.y - 20, harvestable.size.toString(), ctx);
      }
    }
  }
}
