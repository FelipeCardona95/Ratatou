const HarvestableType = {
  Fiber: "Fiber",
  Hide: "Hide",
  Log: "Log",
  Ore: "Ore",
  Rock: "Rock",
};

class Harvestable {
  constructor(id, type, tier, posX, posY, charges, size) {
    this.id = id;
    this.type = type;
    this.tier = tier;
    this.posX = posX;
    this.posY = posY;
    this.hX = 0;
    this.hY = 0;
    this.charges = charges;
    this.size = size;
  }

  setCharges(charges) {
    this.charges = charges;
  }
}

class HarvestablesHandler {
  constructor(settings) {
    this.harvestableList = [];
    this.settings = settings;
  }

  addHarvestable(id, type, tier, posX, posY, charges, size) {
    if (!this.isValidHarvestable(type, tier, charges)) return;

    let harvestable = this.harvestableList.find((item) => item.id === id);

    if (!harvestable) {
      harvestable = new Harvestable(id, type, tier, posX, posY, charges, size);
      this.harvestableList.push(harvestable);
    } else {
      harvestable.setCharges(charges);
    }
  }

  updateHarvestable(id, type, tier, posX, posY, charges, size) {
    if (!this.isValidHarvestable(type, tier, charges)) return;

    let harvestable = this.harvestableList.find((item) => item.id === id);
    if (!harvestable) {
      this.addHarvestable(id, type, tier, posX, posY, charges, size);
    } else {
      harvestable.charges = charges;
      harvestable.size = size;
    }
  }

  isValidHarvestable(type, tier, charges) {
    const typeString = this.getStringType(type);
    const enchantKey = `e${charges}`;
    const harvestingSettings = {
      [HarvestableType.Fiber]: this.settings.harvestingStaticFiber,
      [HarvestableType.Hide]: this.settings.harvestingStaticHide,
      [HarvestableType.Log]: this.settings.harvestingStaticWood,
      [HarvestableType.Ore]: this.settings.harvestingStaticOre,
      [HarvestableType.Rock]: this.settings.harvestingStaticRock,
    };

    return (
      harvestingSettings[typeString] &&
      harvestingSettings[typeString][enchantKey] &&
      harvestingSettings[typeString][enchantKey][tier - 1]
    );
  }

  harvestFinished(parameters) {
    const id = parameters[3];
    const count = parameters[5];
    this.updateHarvestableCount(id, count);
  }

  harvestUpdateEvent(parameters) {
    const id = parameters[0];

    if (parameters[1] === undefined) {
      this.removeHarvestable(id);
    } else {
      const harvestable = this.harvestableList.find((item) => item.id === id);
      if (harvestable) {
        harvestable.size = parameters[1];
      }
    }
  }

  newHarvestableObject(id, parameters) {
    const type = parameters[5];
    const tier = parameters[7];
    const location = parameters[8];
    const enchant = parameters[11] || 0;
    const size = parameters[10] || 0;

    this.updateHarvestable(id, type, tier, location[0], location[1], enchant, size);
  }

  newSimpleHarvestableObject(parameters) {
    const [a0, a1, a2, a3, a4] = parameters.map((param) => param?.data ?? []);

    if (a0.length === 0) return;

    const length = a0.length;
    if ([a1, a2, a3, a4].some((arr) => arr.length !== length)) {
      throw new Error("Parameter arrays have inconsistent lengths");
    }

    for (let i = 0; i < length; i++) {
      const id = a0[i];
      const type = a1[i];
      const tier = a2[i];
      const posX = a3[i * 2];
      const posY = a3[i * 2 + 1];
      const count = a4[i];

      this.addHarvestable(id, type, tier, posX, posY, 0, count);
    }
  }

  removeNotInRange(lpX, lpY) {
    this.harvestableList = this.harvestableList.filter(
      (x) => this.calculateDistance(lpX, lpY, x.posX, x.posY) <= 80 && x.size !== undefined
    );
  }

  calculateDistance(lpX, lpY, posX, posY) {
    const deltaX = lpX - posX;
    const deltaY = lpY - posY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  removeHarvestable(id) {
    this.harvestableList = this.harvestableList.filter((x) => x.id !== id);
  }

  getHarvestableList() {
    return [...this.harvestableList];
  }

  updateHarvestableCount(id, count) {
    const harvestable = this.harvestableList.find((h) => h.id === id);
    if (harvestable) {
      harvestable.size -= count;
    }
  }

  getStringType(typeNumber) {
    if ((typeNumber >= 0 && typeNumber <= 5) || (typeNumber >= 28 && typeNumber <= 32)) {
      return HarvestableType.Log;
    } else if ((typeNumber >= 6 && typeNumber <= 10) || (typeNumber >= 33 && typeNumber <= 37)) {
      return HarvestableType.Rock;
    } else if ((typeNumber >= 11 && typeNumber <= 14) || (typeNumber >= 38 && typeNumber <= 42)) {
      return HarvestableType.Fiber;
    } else if ((typeNumber >= 15 && typeNumber <= 22) || (typeNumber >= 43 && typeNumber <= 47)) {
      return HarvestableType.Hide;
    } else if ((typeNumber >= 23 && typeNumber <= 27) || (typeNumber >= 48 && typeNumber <= 52)) {
      return HarvestableType.Ore;
    } else {
      return "";
    }
  }
}
