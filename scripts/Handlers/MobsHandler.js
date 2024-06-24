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

class Mist {
  constructor(id, posX, posY, name, enchant) {
    this.id = id;
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.enchant = enchant;
    this.hX = 0;
    this.hY = 0;
    this.type = name.toLowerCase().includes("solo") ? 0 : 1;
  }
}

export class MobsHandler {
  constructor(settings) {
    this.settings = settings;
    this.mobsList = [];
    this.mistList = [];
    this.harvestablesNotGood = [];

    this.mobsData = this.transformMobsData(mobsData);

    const logEnemiesList = document.getElementById("logEnemiesList");
    if (logEnemiesList) {
      logEnemiesList.addEventListener("click", () => console.log(this.mobsList));
    }
  }

  transformMobsData(data) {
    return data.reduce((acc, mob) => {
      acc[mob.id] = mob;
      return acc;
    }, {});
  }

  getMobById(id) {
    return this.mobsData[id];
  }

  clear() {
    this.mobsList = [];
    this.mistList = [];
  }

  newMobEvent(parameters) {
    const id = parseInt(parameters[0]);
    const typeId = parseInt(parameters[1]);
    const [posX, posY] = parameters[7];
    const exp = parseFloat(parameters[13]) || 0;
    const name = parameters[32] || parameters[31] || null;
    const enchant = parseInt(parameters[33]) || 0;
    const rarity = parseInt(parameters[19]) || 1;

    if (name) {
      this.addMist(id, posX, posY, name, enchant);
    } else {
      this.addEnemy(id, typeId, posX, posY, exp, enchant, rarity);
    }
  }

  addEnemy(id, typeId, posX, posY, health, enchant, rarity) {
    typeId -= 14;

    if (this.mobsList.some((mob) => mob.id === id) || this.harvestablesNotGood.some((mob) => mob.id === id)) {
      return;
    }

    const mob = new Mob(id, typeId, posX, posY, health, enchant, rarity);

    if (this.mobsData[typeId]) {
      const mobInfo = this.getMobById(typeId);
      Object.assign(mob, {
        tier: mobInfo.tier,
        mobTypeCategory: mobInfo.mobtypecategory,
        uniqueName: mobInfo.uniquename,
        avatar: mobInfo.avatar,
        prefab: mobInfo.prefab,
        type: this.assignTypeBasedOnPrefab(mobInfo.prefab),
        name: this.assignNameBasedOnPrefab(mobInfo.prefab),
        fame: mobInfo.fame,
      });

      if (this.isInvalidHarvestable(mob, enchant)) {
        this.harvestablesNotGood.push(mob);
        return;
      }
    }

    this.mobsList.push(mob);
  }

  assignNameBasedOnPrefab(prefab) {
    if (prefab.includes("_HIDE_")) return "hide";
    if (prefab.includes("_WOOD_")) return "Logs";
    if (prefab.includes("_ORE_")) return "ore";
    if (prefab.includes("_FIBER_")) return "fiber";
    if (prefab.includes("_ROCK_")) return "rock";
    return "unknown";
  }

  assignTypeBasedOnPrefab(prefab) {
    if (prefab.includes("_HIDE_")) return "LivingSkinnable";
    if (["_WOOD_", "_ORE_", "_FIBER_", "_ROCK_"].some((material) => prefab.includes(material))) return "LivingHarvestable";
    return "Unknown";
  }

  isInvalidHarvestable(mob, enchant) {
    if (mob.type === "LivingSkinnable") {
      return !this.settings.harvestingLivingHide[`e${enchant}`][mob.tier - 1];
    }

    if (mob.type === "LivingHarvestable") {
      const harvestingSettings = {
        "_FIBER_": this.settings.harvestingLivingFiber,
        "_HIDE_": this.settings.harvestingLivingHide,
        "_WOOD_": this.settings.harvestingLivingWood,
        "_ORE_": this.settings.harvestingLivingOre,
        "_ROCK_": this.settings.harvestingLivingRock,
      };

      for (const [key, setting] of Object.entries(harvestingSettings)) {
        if (mob.prefab.includes(key) && !setting[`e${enchant}`][mob.tier - 1]) {
          return true;
        }
      }
    }

    return false;
  }

  removeMob(id) {
    const initialSize = this.mobsList.length;
    this.mobsList = this.mobsList.filter((mob) => mob.id !== id);
    if (this.mobsList.length < initialSize) return;
    this.harvestablesNotGood = this.harvestablesNotGood.filter((mob) => mob.id !== id);
  }

  updateMobPosition(id, posX, posY) {
    const mob = this.mobsList.find((mob) => mob.id === id);
    if (mob) {
      mob.posX = posX;
      mob.posY = posY;
    }
  }

  updateEnchantEvent(parameters) {
    const [mobId, enchantmentLevel] = parameters;
    let mob = this.mobsList.find((mob) => mob.id == mobId) || this.harvestablesNotGood.find((mob) => mob.id == mobId);

    if (mob) {
      mob.enchantmentLevel = enchantmentLevel;

      if (this.shouldMoveToMobsList(mob)) {
        this.mobsList.push(mob);
        this.harvestablesNotGood = this.harvestablesNotGood.filter((item) => item.id !== mob.id);
      }
    }
  }

  shouldMoveToMobsList(mob) {
    const enchantKey = `e${mob.enchantmentLevel}`;
    if (mob.type === "LivingSkinnable") {
      return this.settings.harvestingLivingHide[enchantKey][mob.tier - 1];
    }

    const harvestableTypes = {
      fiber: this.settings.harvestingLivingFiber,
      hide: this.settings.harvestingLivingHide,
      Logs: this.settings.harvestingLivingWood,
      ore: this.settings.harvestingLivingOre,
      rock: this.settings.harvestingLivingRock,
    };

    return harvestableTypes[mob.name] && harvestableTypes[mob.name][enchantKey][mob.tier - 1];
  }

  addMist(id, posX, posY, name, enchant) {
    if (!this.mistList.some((mist) => mist.id === id)) {
      this.mistList.push(new Mist(id, posX, posY, name, enchant));
    }
  }

  removeMist(id) {
    this.mistList = this.mistList.filter((mist) => mist.id !== id);
  }

  updateMistPosition(id, posX, posY) {
    const mist = this.mistList.find((mist) => mist.id === id);
    if (mist) {
      mist.posX = posX;
      mist.posY = posY;
    }
  }

  updateMistEnchantmentLevel(id, enchantmentLevel) {
    const mist = this.mistList.find((mist) => mist.id === id);
    if (mist) {
      mist.enchant = enchantmentLevel;
    }
  }
}
