import { EnemyType } from "./EnemyType.js";
import { mobsData } from "/scripts/data/mobsData.js"; // Adjust the path as necessary
import { mobTypeCategory } from "./EnemyType.js";


class Mob {
  constructor(id, typeId, posX, posY, health, enchantmentLevel, rarity) {
    this.id = id;
    this.typeId = typeId;
    this.posX = posX;
    this.posY = posY;
    this.health = health;
    this.enchantmentLevel = enchantmentLevel;
    this.rarity = rarity;
    this.tier = 0;
    this.type = EnemyType.Enemy;
    this.name = null;
    this.exp = 0;
    this.hX = 0;
    this.hY = 0;
  }
}

// MIST PORTALS ??
class Mist {
  constructor(id, posX, posY, name, enchant) {
    this.id = id;
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.enchant = enchant;
    this.hX = 0;
    this.hY = 0;

    if (name.toLowerCase().includes("solo")) {
      this.type = 0;
    } else {
      this.type = 1;
    }
  }
}

export class MobsHandler {
  constructor(settings) {
    this.settings = settings;

    this.mobsList = [];
    this.mistList = [];
    this.mobinfo = {};

    this.harvestablesNotGood = [];

    const logEnemiesList = document.getElementById("logEnemiesList");
    if (logEnemiesList)
      logEnemiesList.addEventListener("click", () =>
        console.log(this.mobsList)
      );
    this.mobsData = this.transformMobsData(mobsData);
  }

  transformMobsData(data) {
    const transformedData = {};

    data.forEach((mob) => {
      transformedData[mob.id] = mob;
    });

    return transformedData;
  }

  getMobById(id) {
    return this.mobsData[id];
  }

  updateMobInfo(newData) {
    this.mobinfo = newData;
  }

  clear() {
    this.mobsList = [];
    this.mistList = [];
  }

  NewMobEvent(parameters) {
    const id = parseInt(parameters[0]); // entity id
    let typeId = parseInt(parameters[1]); // real type id

    const loc = parameters[7];
    let posX = loc[0];
    let posY = loc[1];

    let exp = 0;
    try {
      exp = parseFloat(parameters[13]);
    } catch (error) {
      exp = 0;
    }

    let name = null;
    try {
      name = parameters[32];
    } catch (error) {
      try {
        name = parameters[31];
      } catch (error2) {
        name = null;
      }
    }

    let enchant = 0;
    try {
      enchant = parameters[33];
    } catch (error) {
      enchant = 0;
    }

    let rarity = 1;
    try {
      rarity = parseInt(parameters[19]);
    } catch (error) {
      rarity = 1;
    }

    if (name != null) {
      this.AddMist(id, posX, posY, name, enchant);
    } else {
      //console.log("ID", typeId);
      //console.log("MobData", this.getMobByPosition(typeId - 14));
      this.AddEnemy(id, typeId, posX, posY, exp, enchant, rarity);
    }
  }

  AddEnemy(id, typeId, posX, posY, health, enchant, rarity) {
    if (this.mobsData.some((mob) => mob.id === id)) return;

    if (this.harvestablesNotGood.some((mob) => mob.id === id)) return;

    const h = new Mob(id, typeId, posX, posY, health, enchant, rarity);

    // Check minimum HP
    const minHP = localStorage.getItem("settingMinHP");
    if (h.health < minHP) return;

    // TODO
    // List of enemies
    if (this.mobsData[typeId] != null) {
      const mobsInfo = this.getMobById(typeId);

      h.tier = mobsInfo.tier;
      h.type = mobsInfo.mobtypecategory;
      h.uniqueName = mobsInfo.uniqueName;
      h.avatar = mobsInfo.avatar;
      h.prefab = mobsInfo.prefab;

      if (h.type == EnemyType.LivingSkinnable) {
        if (!this.settings.harvestingLivingHide[`e${enchant}`][h.tier - 1]) {
          this.harvestablesNotGood.push(h);
          return;
        }
      } else if (h.type == EnemyType.LivingHarvestable) {
        let iG = true;

        if (h.prefab.includes("_FIBER_")) {
          if (!this.settings.harvestingLivingFiber[`e${enchant}`][h.tier - 1]) {
            iG = false;
          }
        } else if (h.prefab.includes("_HIDE_")) {
          if (!this.settings.harvestingLivingHide[`e${enchant}`][h.tier - 1]) {
            iG = false;
          }
        } else if (h.prefab.includes("_WOOD_")) {
          if (!this.settings.harvestingLivingWood[`e${enchant}`][h.tier - 1]) {
            iG = false;
          }
        } else if (h.prefab.includes("_ORE_")) {
          if (!this.settings.harvestingLivingOre[`e${enchant}`][h.tier - 1]) {
            iG = false;
          }
        } else if (h.prefab.includes("_ROCK_")) {
          if (!this.settings.harvestingLivingRock[`e${enchant}`][h.tier - 1]) {
            iG = false;
          }
        }

        if (!iG) {
          this.harvestablesNotGood.push(h);
          return;
        }
      } else if (h.type >= EnemyType.Enemy && h.type <= EnemyType.Boss) {
        const offset = EnemyType.Enemy;

        if (!this.settings.enemyLevels[h.type - offset]) return;
      } else if (h.prefab.includes("MOB_AVALON_TREASURE_MINION")) {
        if (!this.settings.avaloneDrones) return;
        if (h.uniqueName.includes("CRYSTALSPIDER") && !this.settings.bossCrystalSpider)
          return;
      } else if (h.prefab.test(/MISTS.*BOSS/)) { //check if its mist boss
         if (h.prefab.includes("FAIRYDRAGON") &&!this.settings.settingBossFairyDragon)
          return;
        else if (h.uniqueName.includes("MISTS_SPIDER") && !this.settings.bossVeilWeaver)
          return;
        else if (h.uniqueName.includes("GRIFFIN") && !this.settings.bossGriffin) return;
      } else if (h.prefab.includes("_EVENT_")) {
        if (!this.settings.showEventEnemies) return;
      } else if (!this.settings.showUnmanagedEnemies) return;
    } else if (!this.settings.showUnmanagedEnemies) return;
D
    this.mobsList.push(h);
  }

  removeMob(id) {
    const pSize = this.mobsList.length;

    this.mobsList = this.mobsList.filter((x) => x.id !== id);

    if (this.mobsList.length < pSize) return;

    this.harvestablesNotGood = this.harvestablesNotGood.filter(
      (x) => x.id !== id
    );
  }

  updateMobPosition(id, posX, posY) {
    var enemy = this.mobsList.find((enemy) => enemy.id === id);

    if (enemy) {
      enemy.posX = posX;
      enemy.posY = posY;
      return;
    }
  }

  updateEnchantEvent(parameters) {
    const mobId = parameters[0];
    const enchantmentLevel = parameters[1];

    var enemy = this.mobsList.find((mob) => mob.id == mobId);

    if (enemy) {
      enemy.enchantmentLevel = enchantmentLevel;
      return;
    }

    enemy = this.harvestablesNotGood.find((mob) => mob.id == mobId);

    if (!enemy) return;

    enemy.enchantmentLevel = enchantmentLevel;

    let hasToSwapFromList = false;

    if (enemy.type == EnemyType.LivingSkinnable) {
      if (
        !this.settings.harvestingLivingHide[`e${enemy.enchantmentLevel}`][
          enemy.tier - 1
        ]
      )
        return;

      hasToSwapFromList = true;
    } else if (enemy.type == EnemyType.LivingHarvestable) {
      switch (enemy.name) {
        case "fiber":
          if (
            !this.settings.harvestingLivingFiber[`e${enemy.enchantmentLevel}`][
              enemy.tier - 1
            ]
          )
            return;

          hasToSwapFromList = true;
          break;

        case "hide":
          if (
            !this.settings.harvestingLivingHide[`e${enemy.enchantmentLevel}`][
              enemy.tier - 1
            ]
          )
            return;

          hasToSwapFromList = true;
          break;

        case "Logs":
          if (
            !this.settings.harvestingLivingWood[`e${enemy.enchantmentLevel}`][
              enemy.tier - 1
            ]
          )
            return;

          hasToSwapFromList = true;
          break;

        case "ore":
          if (
            !this.settings.harvestingLivingOre[`e${enemy.enchantmentLevel}`][
              enemy.tier - 1
            ]
          )
            return;

          hasToSwapFromList = true;
          break;

        case "rock":
          if (
            !this.settings.harvestingLivingRock[`e${enemy.enchantmentLevel}`][
              enemy.tier - 1
            ]
          )
            return;

          hasToSwapFromList = true;
          break;

        default:
          break;
      }
    }

    if (!hasToSwapFromList) return;

    this.mobsList.push(enemy);
    this.harvestablesNotGood = this.harvestablesNotGood.filter(
      (x) => x.id !== enemy.id
    );
  }

  getMobList() {
    return [...this.mobsList];
  }

  AddMist(id, posX, posY, name, enchant) {
    if (this.mistList.some((mist) => mist.id === id)) return;

    const d = new Mist(id, posX, posY, name, enchant);

    this.mistList.push(d);
  }

  removeMist(id) {
    this.mistList = this.mistList.filter((mist) => mist.id !== id);
  }

  updateMistPosition(id, posX, posY) {
    var mist = this.mistList.find((mist) => mist.id === id);

    if (!mist) return;

    mist.posX = posX;
    mist.posY = posY;
  }

  updateMistEnchantmentLevel(id, enchantmentLevel) {
    var mist = this.mistList.find((mist) => mist.id === id);

    if (!mist) return;

    mist.enchant = enchantmentLevel;
  }
}
