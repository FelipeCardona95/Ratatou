class ItemsInfo {
  constructor() {
    this.iteminfo = {};
  }

  addItem(id, name, val) {
    if (val === 0) {
      this.iteminfo[id] = name;
    } else {
      const baseId = id - 1;
      for (let j = 0; j <= 4; j++) {
        const suffix = j === 0 ? "" : `@${j}`;
        this.iteminfo[baseId + j + 1] = `${name}${suffix}`;
      }
    }
  }

  async initItems() {
    try {
      const response = await fetch("/scripts/Handlers/items.txt");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      const lines = data.split("\n");

      for (const line of lines) {
        const match = line.match(/^(\d+):\s+([^\s]+)\s+/);

        if (match) {
          const id = parseInt(match[1]);
          const name = match[2];
          this.addItem(id, name, 0);
        }
      }
    } catch (error) {
      console.error("Failed to initialize items:", error);
    }
  }
}
