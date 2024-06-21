import { MobTypeCategory } from "../Handlers/MobTypeCategory.js";

export class MobsDrawing extends DrawingUtils {
  constructor(Settings) {
    super(Settings);
  }

  interpolate(mobs, mists, lpX, lpY, t) {
    for (const mobOne of mobs) {
      const hX = -1 * mobOne.posX + lpX;
      const hY = mobOne.posY - lpY;

      if (mobOne.hY == 0 && mobOne.hX == 0) {
        mobOne.hX = hX;
        mobOne.hY = hY;
      }

      mobOne.hX = this.lerp(mobOne.hX, hX, t);
      mobOne.hY = this.lerp(mobOne.hY, hY, t);
    }

    for (const mistOne of mists) {
      const hX = -1 * mistOne.posX + lpX;
      const hY = mistOne.posY - lpY;

      if (mistOne.hY == 0 && mistOne.hX == 0) {
        mistOne.hX = hX;
        mistOne.hY = hY;
      }

      mistOne.hX = this.lerp(mistOne.hX, hX, t);
      mistOne.hY = this.lerp(mistOne.hY, hY, t);
    }
  }

  shouldReturnStandardBasedOnCategory(h) {
    const standardEnemies = this.settings.returnLocalBool("settingStandardEnemy");
    const categoriesToCheck = [MobTypeCategory.TRASH, null, MobTypeCategory.ROAMING, MobTypeCategory.ENVIRONMENT, MobTypeCategory.STANDARD, MobTypeCategory.SUMMON];
    return categoriesToCheck.includes(h.mobTypeCategory) && !standardEnemies && h.type == 'Unknown'
  }

  shouldReturnTreasureBasedOnCategory(h) {
    const chestEnemies = this.settings.returnLocalBool("settingChestEnemy");
    const categoriesToCheck = [MobTypeCategory.CHEST];
    return categoriesToCheck.includes(h.mobTypeCategory) && !chestEnemies
  }
  
  shouldReturnBasedOnType(h) {
    const miniBossEnemies = this.settings.returnLocalBool("settingMiniBossEnemy");
    const championEnemies = this.settings.returnLocalBool("settingChampionEnemy");
    const bossEnemies = this.settings.returnLocalBool("settingBossEnemy");
    if (h.mobTypeCategory === MobTypeCategory.CHAMPION && !championEnemies) return true;
    if (h.mobTypeCategory === MobTypeCategory.MINIBOSS && !miniBossEnemies) return true;
    if (h.mobTypeCategory === MobTypeCategory.BOSS && !bossEnemies) return true;
    return false;
  }
  
  shouldReturnBasedOnPrefab(h) {
    const avaloneDrones = this.settings.returnLocalBool("settingAvaloneDrones");
    const bossCrystalSpider = this.settings.returnLocalBool("settingBossCrystalSpider");
    const bossFairyDragon = this.settings.returnLocalBool("settingBossFairyDragon");
    const bossVeilWeaver = this.settings.returnLocalBool("settingBossVeilWeaver");
    const bossGriffin = this.settings.returnLocalBool("settingBossGriffin");
    if (h.prefab.includes("MOB_AVALON_TREASURE_MINION")) {
      if (!avaloneDrones) return true;
    } else if (/MISTS.*BOSS/.test(h.prefab)) {
      if (h.prefab.includes("FAIRYDRAGON") && !bossFairyDragon) return true;
      if (h.uniqueName.includes("MISTS_SPIDER") && !bossVeilWeaver) return true;
      if (h.uniqueName.includes("GRIFFIN") && !bossGriffin) return true;
    } else if (h.prefab.includes("_EVENT_")) {
      if (!this.settings.showEventEnemies) return true;
    } else if(h.uniqueName.includes("CRYSTALSPIDER") && !bossCrystalSpider){ return true;
    } else if (!this.settings.showUnmanagedEnemies) {
      return true;
    }
    return false;
  }

  invalidate(ctx, mobs, mists) {

    const minHP = localStorage.getItem("settingMinHP");
    const minFame = localStorage.getItem("settingMinFame");

    for (const mobOne of mobs) {
      
    if (mobOne.health < minHP && mobOne.type == 'Unknown' && mobOne.mobTypeCategory != MobTypeCategory.CHEST) continue;
    if (mobOne.fame < minFame && mobOne.type == 'Unknown' && mobOne.mobTypeCategory != MobTypeCategory.CHEST) continue;
    if (this.shouldReturnStandardBasedOnCategory(mobOne) || this.shouldReturnBasedOnType(mobOne) || this.shouldReturnBasedOnPrefab(mobOne) || this.shouldReturnTreasureBasedOnCategory(mobOne)) {
        continue;
      }
      const point = this.transformPoint(mobOne.hX, mobOne.hY);

      let imageName = undefined;
      let imageFolder = "Resources"; // Default to Resources folder
      let sizeImg = 40;
      /* Set by default to enemy, since there are more, so we don't add at each case */
      let drawHp = this.settings.enemiesHP;
      let drawId = this.settings.enemiesID;

      if (
        mobOne.type == "LivingSkinnable" ||
        mobOne.type == "LivingHarvestable"
      ) {
        imageName =
          mobOne.name + "_" + mobOne.tier + "_" + mobOne.enchantmentLevel;
        drawHp = this.settings.livingResourcesHp;
        drawId = this.settings.livingResourcesID;
      } else {
        imageName = mobOne.avatar;
        imageFolder = "Mobs";
        sizeImg = 60; 

      }

      if (imageName !== undefined)
        this.DrawCustomImage(ctx, point.x, point.y, imageName, imageFolder, sizeImg);
      else this.drawFilledCircle(ctx, point.x, point.y, 10, "#4169E1"); // Unmanaged ids

      if (drawHp) {
        // TODO
        // Draw health bar?
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

      if (drawId) this.drawText(point.x, point.y - 20, mobOne.typeId, ctx);
    }

    /* Mist portals */
    for (const mistsOne of mists) {
      if (!this.settings.mistEnchants[mistsOne.enchant]) {
        continue;
      }

      if (
        (this.settings.mistSolo && mistsOne.type == 0) ||
        (this.settings.mistDuo == true && mistsOne.type == 1)
      ) {
        // Change image folder
        const point = this.transformPoint(mistsOne.hX, mistsOne.hY);
        this.DrawCustomImage(
          ctx,
          point.x,
          point.y,
          "mist_" + mistsOne.enchant,
          "Resources",
          30
        );
      }
    }
  }
}
