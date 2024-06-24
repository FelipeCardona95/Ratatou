export class PlayersDrawing extends DrawingUtils {
  constructor(Settings, spellsInfo) {
    super(Settings);
    this.itemsInfo = {};
    this.spellsInfo = spellsInfo;
  }

  updateItemsInfo(newData) {
    this.itemsInfo = newData;
  }

  updateSpellsInfo(newData) {
    this.spellsInfo = newData;
  }

  calculateRemainingCooldown(currentTime, spellEndTime) {
    const timeDifference = Math.abs(spellEndTime.getTime() - currentTime.getTime());
    return parseFloat((timeDifference / 1000).toFixed(1));
  }

  sortPlayersByDistance(players) {
    const sortedPlayers = players.slice().sort((a, b) => a.distance - b.distance);
    const top3 = sortedPlayers.slice(0, 3);
    const originalTop3 = players.filter(player => top3.includes(player));
    const rest = sortedPlayers.slice(3);
    return originalTop3.concat(rest);
  }

  drawItems(context, canvas, players, devMode, castedSpells, spellsDev, alreadyFilteredPlayers, filteredGuilds, filteredAlliances) {
    let posY = 15;
    const currentTime = new Date();
    const sortedPlayers = this.sortPlayersByDistance(players);

    if (players.length <= 0) {
      this.settings.ClearPreloadedImages("Items");
      return;
    }

    for (const playerOne of sortedPlayers) {
      if (this.isPlayerFiltered(playerOne, alreadyFilteredPlayers, filteredGuilds, filteredAlliances)) continue;
      if (!playerOne.items) continue;

      let posX = 5;
      const total = posY + 20;
      if (total > canvas.height) break;

      this.drawPlayerInfo(context, playerOne, posX, posY);
      posX += 20;
      posY += 25;

      if (playerOne.items["type"] === "Buffer") {
        posY += 50;
        continue;
      }

      this.drawPlayerItems(context, playerOne.items, posX, posY, devMode);
      posY += 45;

      if (playerOne.spells) {
        this.drawPlayerSpells(context, playerOne, posX, posY, currentTime, castedSpells);
        posY += 45;
        if (spellsDev) {
          this.drawTextItems(posX, posY - 15, Object.values(playerOne.spells).join(" "), context, "14px", "white");
        }
      }
    }
  }

  isPlayerFiltered(player, alreadyFilteredPlayers, filteredGuilds, filteredAlliances) {
    const guildFiltered = filteredGuilds.includes(player.guildName.toUpperCase());
    const allianceFiltered = filteredAlliances.includes(player.alliance.toUpperCase());
    const playerFiltered = alreadyFilteredPlayers.includes(player.nickname.toUpperCase());
    return guildFiltered || allianceFiltered || playerFiltered;
  }

  drawPlayerInfo(context, player, posX, posY) {
    const flagName = FactionFlagInfo[player.flagId || 0];
    this.drawCustomImage(context, posX + 10, posY - 5, flagName, "Flags", 20);
    let posTemp = posX + 25;

    const nickname = player.nickname;
    this.drawTextItems(posTemp, posY, nickname, context, "14px", "white");

    posTemp += context.measureText(nickname).width + 10;
    this.drawTextItems(
      posTemp,
      posY,
      `${player.currentHealth}/${player.initialHealth}`,
      context,
      "14px",
      "red"
    );
  }

  drawPlayerItems(context, items, posX, posY, devMode) {
    let itemsListString = "";
    for (const item of items) {
      const itemInfo = this.itemsInfo[item];
      if (itemInfo && this.settings.GetPreloadedImage(itemInfo, "Items") !== null) {
        this.drawCustomImage(context, posX, posY, itemInfo, "Items", 40);
      }
      posX += 50;
      itemsListString += `${item} `;
    }
    if (devMode) {
      this.drawTextItems(posX, posY - 5, itemsListString, context, "14px", "white");
    }
  }

  drawPlayerSpells(context, player, posX, posY, currentTime, castedSpells) {
    if (this.settings.settingSpells) {
      posX = 25;
      const spellKeys = ["weaponFirst", "weaponSecond", "weaponThird", "helmet", "chest", "boots"];
      for (const key of spellKeys) {
        let spellIcon = "";
        if (player.spells[key] in this.spellsInfo.spellList) {
          spellIcon = this.spellsInfo.spellList[player.spells[key]].icon;
        } else {
          this.spellsInfo.logMissingSpell(player.spells[key]);
        }
        if (spellIcon && this.settings.GetPreloadedImage(spellIcon, "Spells") !== null) {
          this.drawCustomImage(context, posX, posY, spellIcon, "Spells", 50);
        }

        const spellKey = `${player.id}_${player.spells[key]}`;
        if (spellKey in castedSpells) {
          const remainingTime = this.calculateRemainingCooldown(currentTime, castedSpells[spellKey]);
          this.drawFilledCircle(context, posX, posY, 25, "#00000099");
          this.drawText(posX, posY, remainingTime.toString(), context);
        }
        posX += 50;
      }
    }
  }

  interpolate(players, lpX, lpY, t) {
    for (const player of players) {
      const hX = -1 * player.posX + lpX;
      const hY = player.posY - lpY;
      player.distance = Math.round(Math.sqrt((player.posX - lpX) ** 2 + (player.posY - lpY) ** 2));
      if (player.hX === 0 && player.hY === 0) {
        player.hX = hX;
        player.hY = hY;
      }
      player.hX = this.lerp(player.hX, hX, t);
      player.hY = this.lerp(player.hY, hY, t);
    }
  }

  invalidate(context, players, alreadyFilteredPlayers, filteredGuilds, filteredAlliances) {
    const showFilteredPlayers = this.settings.returnLocalBool("settingDrawFilteredPlayers");
    const showFilteredGuilds = this.settings.returnLocalBool("settingDrawFilteredGuilds");
    const showFilteredAlliances = this.settings.returnLocalBool("settingDrawFilteredAlliances");

    for (const player of players) {
      if (!showFilteredGuilds && filteredGuilds.includes(player.guildName.toUpperCase())) continue;
      if (!showFilteredAlliances && filteredAlliances.includes(player.alliance.toUpperCase())) continue;
      if (!showFilteredPlayers && alreadyFilteredPlayers.includes(player.nickname.toUpperCase())) continue;

      const point = this.transformPoint(player.hX, player.hY);
      this.drawPlayerStatus(context, player, point);

      let space = 0;
      if (this.settings.settingNickname) {
        space += 23;
        this.drawText(point.x, point.y + space, player.nickname, context);
      }
      if (this.settings.settingDistance) {
        this.drawText(point.x, point.y - 14, `${player.distance}m`, context);
      }
      if (this.settings.settingHealth) {
        this.drawHealthBar(context, player, point, space);
      }
      if (this.settings.settingGuild) {
        space += 14;
        if (player.guildName !== "undefined") {
          this.drawText(point.x, point.y + space, player.guildName, context);
        }
      }
    }
  }

  drawPlayerStatus(context, player, point) {
    const flagId = player.flagId || 0;
    const flagName = FactionFlagInfo[flagId];

    if (this.settings.settingMounted) {
      context.beginPath();
      context.arc(point.x, point.y, 11, 0, 2 * Math.PI, false);
      context.strokeStyle = player.mounted ? 'green' : 'red';
      context.lineWidth = 3;
      context.stroke();
    }

    this.drawCustomImage(context, point.x, point.y, flagName, "Flags", 20);
  }

  drawHealthBar(context, player, point, space) {
    const percent = player.currentHealth / player.initialHealth;
    const width = 60;
    const height = 7;
    context.fillStyle = "#121317";
    context.fillRect(point.x - width / 2, point.y - height / 2 + space, width, height);
    context.fillStyle = "red";
    context.fillRect(point.x - width / 2, point.y - height / 2 + space, width * percent, height);
  }
}