import { mobsData } from "/scripts/data/mobsData.js"; // Adjust the path as necessary


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
    this.type = null;
    this.mobTypeCategory = null;
    this.uniqueName = null;
    this.avatar = null;
    this.name = null;
    this.exp = 0;
    this.hX = 0;
    this.hY = 0;
    this.fame = 0;
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
      this.AddEnemy(id, typeId, posX, posY, exp, enchant, rarity);
    }
  }

  AddEnemy(id, typeId, posX, posY, health, enchant, rarity) {

    typeId -=14;
    if (this.mobsList.some((mob) => mob.id === id)) return;

    if (this.harvestablesNotGood.some((mob) => mob.id === id)) return;

    const h = new Mob(id, typeId, posX, posY, health, enchant, rarity);

    // TODO
    // List of enemies
    if (this.mobsData[typeId] != null) {
      const mobsInfo = this.getMobById(typeId);
      h.tier = mobsInfo.tier;
      h.mobTypeCategory = mobsInfo.mobtypecategory;
      h.uniqueName = mobsInfo.uniquename;
      h.avatar = mobsInfo.avatar;
      h.prefab = mobsInfo.prefab;
      h.type =  this.assignTypeBasedOnPrefab(mobsInfo.prefab);
      h.name = this.assignNameBasedOnPrefab(mobsInfo.prefab);
      h.fame = mobsInfo.fame;
      if (h.type == "LivingSkinnable") {
        if (!this.settings.harvestingLivingHide[`e${enchant}`][h.tier - 1]) {
          this.harvestablesNotGood.push(h);
          return;
        }
      } else if (h.type == "LivingHarvestable") {
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
        }//Check if enemy is regular Enemy
      }
    }
    this.mobsList.push(h);
  }

  assignNameBasedOnPrefab(mobPrefab) {
    let mobName = '';
    if (mobPrefab.includes('_HIDE_')) {
      mobName = 'hide';
    } else if (mobPrefab.includes('_WOOD_')) {
      mobName = 'Logs';
    } else if (mobPrefab.includes('_ORE_')) {
      mobName = 'ore';
    } else if (mobPrefab.includes('_FIBER_')) {
      mobName = 'fiber';
    }else if (mobPrefab.includes('_ROCK_')) {
      mobName = 'rock';
    }else {
      mobName = 'unknown'; // Optional: handle cases where the prefab doesn't match any criteria
    }
    return mobName;
  }

  assignTypeBasedOnPrefab(mobPrefab) {
    let mobType = '';
    if (mobPrefab.includes('_HIDE_')) {
      mobType = 'LivingSkinnable';
    } else if (mobPrefab.includes('_WOOD_') || mobPrefab.includes('_ORE_') || mobPrefab.includes('_FIBER_')) {
      mobType = 'LivingHarvestable';
    } else {
      mobType = 'Unknown'; // Optional: handle cases where the prefab doesn't match any criteria
    }
    return mobType;
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

    if (enemy.type == "LivingSkinnable") {
      if (
        !this.settings.harvestingLivingHide[`e${enemy.enchantmentLevel}`][
          enemy.tier - 1
        ]
      )
        return;

      hasToSwapFromList = true;
    } else if (enemy.type == "LivingHarvestable") {
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
