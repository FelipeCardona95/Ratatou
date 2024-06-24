class Fish {
  constructor(id, posX, posY, type, sizeSpawned = 0, sizeLeftToSpawn = 0) {
    this.id = id;
    this.posX = posX;
    this.posY = posY;
    this.type = type;
    this.sizeSpawned = sizeSpawned;
    this.sizeLeftToSpawn = sizeLeftToSpawn;
    this.totalSize = this.sizeSpawned + this.sizeLeftToSpawn;
    this.hX = 0;
    this.hY = 0;
  }
}

export class FishingHandler {
  constructor(settings) {
    this.settings = settings;
    this.fishes = [];
  }

  newFishEvent(parameters) {
    if (!this.settings.showFish) return;

    const [id, coor, sizeSpawned, sizeLeftToSpawn, type] = parameters;
    if (!type || !coor) return;

    const [posX, posY] = coor;

    this.upsertFish(id, posX, posY, type, sizeSpawned, sizeLeftToSpawn);
  }

  upsertFish(id, posX, posY, type, sizeSpawned, sizeLeftToSpawn) {
    const fish = new Fish(id, posX, posY, type, sizeSpawned, sizeLeftToSpawn);

    const index = this.fishes.findIndex((f) => f.id === fish.id);
    if (index !== -1) {
      this.fishes[index] = fish;
    } else {
      this.fishes.push(fish);
    }
  }

  fishingEnd(parameters) {
    if (!this.settings.showFish) return;

    const [id] = parameters;
    this.removeFish(id);
  }

  removeFish(id) {
    this.fishes = this.fishes.filter((fish) => fish.id !== id);
  }
}
