import { MobTypeCategory } from "../Handlers/MobTypeCategory.js";

export class MobsDrawing extends DrawingUtils {
  constructor(Settings) {
    super(Settings);
  }

  interpolate(entities, lpX, lpY, t) {
    for (const entity of entities) {
      const hX = -1 * entity.posX + lpX;
      const hY = entity.posY - lpY;

      if (entity.hX === 0 && entity.hY === 0) {
        entity.hX = hX;
        entity.hY = hY;
      }

      entity.hX = this.lerp(entity.hX, hX, t);
      entity.hY = this.lerp(entity.hY, hY, t);
    }
  }

  shouldReturnBasedOnSettings(entity, settingKey, category) {
    const settingValue = this.settings.returnLocalBool(settingKey);
    return entity.mobTypeCategory === category && !settingValue;
  }

  shouldReturnBasedOnPrefab(entity) {
    const settings = this.settings;
    if (entity.prefab.includes("MOB_AVALON_TREASURE_MINION")) {
      return !settings.returnLocalBool("settingAvaloneDrones");
    }
    if (/MISTS.*BOSS/.test(entity.prefab)) {
      if (entity.prefab.includes("FAIRYDRAGON")) {
        return !settings.returnLocalBool("settingBossFairyDragon");
      }
      if (entity.uniqueName.includes("MISTS_SPIDER")) {
        return !settings.returnLocalBool("settingBossVeilWeaver");
      }
      if (entity.uniqueName.includes("GRIFFIN")) {
        return !settings.returnLocalBool("settingBossGriffin");
      }
    }
    if (entity.prefab.includes("_EVENT_")) {
      return !settings.showEventEnemies;
    }
    if (entity.uniqueName.includes("CRYSTALSPIDER")) {
      return !settings.returnLocalBool("settingBossCrystalSpider");
    }
    return !settings.showUnmanagedEnemies;
  }

  invalidate(ctx, mobs, mists) {
    const minHP = localStorage.getItem("settingMinHP");
    const minFame = localStorage.getItem("settingMinFame");
    const showMobIcons = this.settings.returnLocalBool("settingShowMobIcons");

    const shouldReturnEntity = (entity) => {
      if (
        (entity.health < minHP || entity.fame < minFame) &&
        entity.type === "Unknown" &&
        entity.mobTypeCategory !== MobTypeCategory.CHEST
      ) {
        return true;
      }
      if (
        this.shouldReturnBasedOnSettings(
          entity,
          "settingStandardEnemy",
          MobTypeCategory.STANDARD
        ) ||
        this.shouldReturnBasedOnSettings(
          entity,
          "settingChestEnemy",
          MobTypeCategory.CHEST
        ) ||
        this.shouldReturnBasedOnSettings(
          entity,
          "settingMiniBossEnemy",
          MobTypeCategory.MINIBOSS
        ) ||
        this.shouldReturnBasedOnSettings(
          entity,
          "settingChampionEnemy",
          MobTypeCategory.CHAMPION
        ) ||
        this.shouldReturnBasedOnSettings(
          entity,
          "settingBossEnemy",
          MobTypeCategory.BOSS
        ) ||
        this.shouldReturnBasedOnPrefab(entity)
      ) {
        return true;
      }
      return false;
    };

    for (const mobOne of mobs) {
      if (shouldReturnEntity(mobOne)) continue;

      const point = this.transformPoint(mobOne.hX, mobOne.hY);
      let imageName = undefined;
      let imageFolder = "Resources";
      let sizeImg = 40;
      let drawHp = this.settings.enemiesHP;
      let drawId = this.settings.enemiesID;

      if (
        mobOne.type === "LivingSkinnable" ||
        mobOne.type === "LivingHarvestable"
      ) {
        imageName = `${mobOne.name}_${mobOne.tier}_${mobOne.enchantmentLevel}`;
        drawHp = this.settings.livingResourcesHp;
        drawId = this.settings.livingResourcesID;
      } else if (!showMobIcons && !this.isStandard(mobOne)) {
        if (this.isStandard(mobOne)) {
          imageName = MobTypeCategory.STANDARD;
        } else {
          switch (mobOne.mobTypeCategory) {
            case MobTypeCategory.CHAMPION:
              imageName = MobTypeCategory.CHAMPION;
              break;
            case MobTypeCategory.MINIBOSS:
              imageName = MobTypeCategory.MINIBOSS;
              break;
            case MobTypeCategory.BOSS:
              imageName = MobTypeCategory.BOSS;
              break;
            default:
              imageName = mobOne.avatar;
          }
        }
      } else {
        imageName = mobOne.avatar;
        imageFolder = "Mobs";
        sizeImg = 60;
      }

      if (imageName) {
        this.DrawCustomImage(ctx, point.x, point.y, imageName, imageFolder, sizeImg);
      } else {
        this.drawFilledCircle(ctx, point.x, point.y, 10, "#4169E1");
      }

      if (drawHp) {
        const textWidth = ctx.measureText(mobOne.health).width;
        this.drawTextItems(
          point.x - textWidth / 2,
          point.y + 24,
          mobOne.health,
          ctx,
          "12px",
          "yellow"
        );
      }

      if (drawId) {
        this.drawText(point.x, point.y - 20, mobOne.typeId, ctx);
      }
    }

    for (const mistOne of mists) {
      if (!this.settings.mistEnchants[mistOne.enchant]) continue;
      if (
        (this.settings.mistSolo && mistOne.type === 0) ||
        (this.settings.mistDuo && mistOne.type === 1)
      ) {
        const point = this.transformPoint(mistOne.hX, mistOne.hY);
        this.DrawCustomImage(
          ctx,
          point.x,
          point.y,
          `mist_${mistOne.enchant}`,
          "Resources",
          30
        );
      }
    }
  }
}
