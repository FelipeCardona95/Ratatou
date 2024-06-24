import { SpellSlots } from './SpellSlots.js';

class Player {
  constructor(
    posX,
    posY,
    id,
    nickname,
    guildName,
    currentHealth,
    initialHealth,
    items,
    flagId,
    spells,
    alliance
  ) {
    this.posX = posX;
    this.posY = posY;
    this.oldPosX = posX;
    this.oldPosY = posY;
    this.id = id;
    this.nickname = nickname;
    this.guildName = guildName;
    this.alliance = alliance;
    this.hX = 0;
    this.hY = 0;
    this.currentHealth = currentHealth;
    this.initialHealth = initialHealth;
    this.items = items;
    this.flagId = flagId;
    this.mounted = false; // Initialize mounted status as false
    if (Array.isArray(spells) && spells.length >= 6) {
      this.spells = new SpellSlots(spells[0], spells[1], spells[2], spells[4], spells[3], spells[5]);
    } else {
      this.spells = new SpellSlots();
    }
  }

  setMounted(mounted) {
    this.mounted = mounted;
  }
}

export class PlayersHandler {
  constructor(settings, spellsInfo) {
    this.playersInRange = [];
    this.localPlayer = new Player();
    this.invalidate = false;

    this.settings = settings;
    this.filteredPlayers = [];
    this.filteredGuilds = [];
    this.filteredAlliances = [];
    this.alreadyFilteredPlayers = [];
    this.spellInfo = spellsInfo;
    this.castedSpells = {};

    this.initializeIgnoreList();
  }

  initializeIgnoreList() {
    this.settings.ignoreList.forEach((element) => {
      const name = element["Name"];
      switch (element["Type"]) {
        case "Player":
          this.filteredPlayers.push(name);
          break;
        case "Guild":
          this.filteredGuilds.push(name);
          break;
        case "Alliance":
          this.filteredAlliances.push(name);
          break;
        default:
          this.filteredPlayers.push(name);
          break;
      }
    });
  }

  getPlayersInRange() {
    return [...this.playersInRange];
  }

  updateItems(id, parameters) {
    const items = parameters[2] || null;
    if (items) {
      const player = this.playersInRange.find((p) => p.id === id);
      if (player) {
        player.items = items;
      }
    }
  }

  handleNewPlayerEvent(parameters) {
    if (!this.settings.settingOnOff) return;

    const id = parameters[0];
    const nickname = parameters[1];

    if (this.isPlayerFiltered(nickname)) return;

    const guildName = String(parameters[8]);
    if (this.filteredGuilds.find((name) => name === guildName.toUpperCase())) {
      this.alreadyFilteredPlayers.push(nickname.toUpperCase());
    }

    const alliance = String(parameters[49]);
    if (this.filteredAlliances.find((name) => name === alliance.toUpperCase())) {
      this.alreadyFilteredPlayers.push(nickname.toUpperCase());
    }

    const [posX, posY] = parameters[14];
    const currentHealth = parameters[20];
    const initialHealth = parameters[21];
    const items = parameters[38];
    const flagId = parameters[51];
    const spells = parameters[41];

    this.addPlayer(
      posX,
      posY,
      id,
      nickname,
      guildName,
      currentHealth,
      initialHealth,
      items,
      this.settings.settingSound,
      flagId,
      spells,
      alliance
    );
  }

  isPlayerFiltered(nickname) {
    const upperNickname = nickname.toUpperCase();
    if (
      this.alreadyFilteredPlayers.includes(upperNickname) ||
      this.filteredPlayers.includes(upperNickname)
    ) {
      this.alreadyFilteredPlayers.push(upperNickname);
      return true;
    }
    return false;
  }

  handleMountedPlayerEvent(id, parameters) {
    const mounted =
      parameters[11] === "true" || parameters[11] === true || parameters[10] === "-1";
    this.updatePlayerMounted(id, mounted);
  }

  addPlayer(
    posX,
    posY,
    id,
    nickname,
    guildName,
    currentHealth,
    initialHealth,
    items,
    sound,
    flagId,
    spells,
    alliance
  ) {
    if (this.playersInRange.some((player) => player.id === id)) return;

    const player = new Player(
      posX,
      posY,
      id,
      nickname,
      guildName,
      currentHealth,
      initialHealth,
      items,
      flagId,
      spells,
      alliance
    );
    this.playersInRange.push(player);

    if (sound) {
      this.playSound();
    }
  }

  playSound() {
    const audio = new Audio("/sounds/player.mp3");
    const volume = document.getElementById("playerVolumeSlider").value / 100;
    audio.volume = volume;

    audio.play();
  }

  updateLocalPlayerNextPosition(posX, posY) {
    throw new Error("Not implemented");
  }

  updatePlayerMounted(id, mounted) {
    const player = this.playersInRange.find((p) => p.id === id);
    if (player) {
      player.setMounted(mounted);
    }
  }

  removePlayer(id) {
    this.playersInRange = this.playersInRange.filter((player) => player.id !== id);
  }

  updateLocalPlayerPosition(posX, posY) {
    this.localPlayer.posX = posX;
    this.localPlayer.posY = posY;
  }

  localPlayerPosX() {
    return this.localPlayer.posX;
  }

  localPlayerPosY() {
    return this.localPlayer.posY;
  }

  updatePlayerPosition(id, posX, posY) {
    const player = this.playersInRange.find((p) => p.id === id);
    if (player) {
      player.posX = posX;
      player.posY = posY;
    }
  }

  updatePlayerHealth(parameters) {
    const player = this.playersInRange.find((p) => p.id === parameters[0]);
    if (player) {
      player.currentHealth = parameters[2];
      player.initialHealth = parameters[3];
    }
  }

  updateSpells(playerId, parameters) {
    const spells = this.parseSpells(parameters[6]);
    const player = this.playersInRange.find((p) => p.id === playerId);
    if (player) {
      player.spells = spells;
    }
  }

  parseSpells(spellData) {
    try {
      return new SpellSlots(
        spellData[0],
        spellData[1],
        spellData[2],
        spellData[4],
        spellData[3],
        spellData[5]
      );
    } catch {
      return new SpellSlots(65535, 65535, 65535, 65535, 65535, 65535);
    }
  }

  handleCastSpell(parameters) {
    const { playerId, spellId } = parameters;
    const spell = this.spellInfo.spellList[spellId];
    if (spell) {
      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + spell.cooldown);
      this.castedSpells[`${playerId}_${spell.parentId || spell.id}`] = expirationTime;
    }
  }

  removeSpellsWithoutCooldown() {
    const now = new Date();
    for (const key in this.castedSpells) {
      if (this.castedSpells[key] < now) {
        delete this.castedSpells[key];
      }
    }
  }

  clear() {
    this.playersInRange = [];
  }
}
