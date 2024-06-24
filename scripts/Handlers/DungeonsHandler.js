const DungeonType = {
  Solo: 0,
  Group: 1,
  Corrupted: 2,
  Hellgate: 3,
};

class Dungeon {
  constructor(id, posX, posY, name, type, enchant) {
    this.id = id;
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.enchant = enchant;
    this.type = type;
    this.drawName = undefined;
    this.hX = 0;
    this.hY = 0;

    this.setDrawNameByType();
  }

  setDrawNameByType() {
    const typeMapping = {
      [DungeonType.Solo]: `dungeon_${this.enchant}`,
      [DungeonType.Group]: `group_${this.enchant}`,
      [DungeonType.Corrupted]: "corrupt",
      [DungeonType.Hellgate]: "hellgate",
    };
    this.drawName = typeMapping[this.type];
  }
}

class DungeonsHandler {
  constructor(Settings) {
    this.dungeonList = [];
    this.settings = Settings;
  }

  dungeonEvent(parameters) {
    const [id, position, , name, , , enchant] = parameters;
    this.addDungeon(id, position[0], position[1], name, enchant);
  }

  addDungeon(id, posX, posY, name, enchant) {
    if (this.dungeonList.some((dungeon) => dungeon.id === id)) return;

    const lowerCaseName = name.toLowerCase();
    const dungeonType = this.determineDungeonType(lowerCaseName, enchant);
    if (dungeonType === undefined) return;

    const newDungeon = new Dungeon(id, posX, posY, name, dungeonType, enchant);
    this.dungeonList.push(newDungeon);
  }

  determineDungeonType(name, enchant) {
    if (name.includes("corrupted")) {
      return this.settings.dungeonCorrupted ? DungeonType.Corrupted : undefined;
    }
    if (name.includes("solo")) {
      return this.settings.dungeonSolo && this.settings.dungeonEnchants[enchant] 
        ? DungeonType.Solo 
        : undefined;
    }
    if (name.includes("hellgate")) {
      return this.settings.dungeonHellgate ? DungeonType.Hellgate : undefined;
    }
    return this.settings.dungeonGroup && this.settings.dungeonEnchants[enchant] 
      ? DungeonType.Group 
      : undefined;
  }

  removeDungeon(id) {
    this.dungeonList = this.dungeonList.filter((dungeon) => dungeon.id !== id);
  }
}
