import { PlayersDrawing } from "../Drawings/PlayersDrawing.js";
import { HarvestablesDrawing } from "../Drawings/HarvestablesDrawing.js";
import { MobsDrawing } from "../Drawings/MobsDrawing.js";
import { ChestsDrawing } from "../Drawings/ChestsDrawing.js";
import { DungeonsDrawing } from "../Drawings/DungeonsDrawing.js";
import { MapDrawing } from "../Drawings/MapsDrawing.js";
import { WispCageDrawing } from "../Drawings/WispCageDrawing.js";
import { FishingDrawing } from "../Drawings/FishingDrawing.js";

import { TrackFootprintsDrawing } from "../Drawings/TrackFootprintsDrawing.js";
import { EventCodes } from "./EventCodes.js";

import { PlayersHandler } from "../Handlers/PlayersHandler.js";
import { MobsHandler } from "../Handlers/MobsHandler.js";
import { WispCageHandler } from "../Handlers/WispCageHandler.js";
import { FishingHandler } from "../Handlers/FishingHandler.js";
import { TrackFootprintsHandler } from "../Handlers/TrackFootprintsHandler.js";
import { SpellsInfo } from '../Handlers/SpellsInfo.js';
import { Settings } from './Settings.js';


var canvasMap = document.getElementById("mapCanvas");
var contextMap = canvasMap.getContext("2d");

var canvasGrid = document.getElementById("gridCanvas");
var contextGrid = canvasGrid.getContext("2d");

var canvas = document.getElementById("drawCanvas");
var context = canvas.getContext("2d");

var canvasOurPlayer = document.getElementById("ourPlayerCanvas");
var contextOurPlayer = canvasOurPlayer.getContext("2d");

var canvasItems = document.getElementById("playersCanvas");
var contextItems = canvasItems.getContext("2d");

const settings = new Settings();

const harvestablesDrawing = new HarvestablesDrawing(settings);
const dungeonsHandler = new DungeonsHandler(settings);

var itemsInfo = new ItemsInfo();
var spellsInfo = new SpellsInfo();

itemsInfo.initItems();
spellsInfo.initSpells();

var map = new MapH(-1);
const mapsDrawing = new MapDrawing(settings);

const chestsHandler = new ChestsHandler();
const mobsHandler = new MobsHandler(settings);
const harvestablesHandler = new HarvestablesHandler(settings);
const playersHandler = new PlayersHandler(settings,spellsInfo);

const wispCageHandler = new WispCageHandler(settings);
const wispCageDrawing = new WispCageDrawing(settings);

const fishingHandler = new FishingHandler(settings);
const fishingDrawing = new FishingDrawing(settings);

const chestsDrawing = new ChestsDrawing(settings);
const mobsDrawing = new MobsDrawing(settings);
const playersDrawing = new PlayersDrawing(settings,spellsInfo);
const dungeonsDrawing = new DungeonsDrawing(settings);
const trackFootprintsHandler = new TrackFootprintsHandler(settings);
const trackFootprintsDrawing = new TrackFootprintsDrawing(settings);
playersDrawing.updateItemsInfo(itemsInfo.iteminfo);
playersDrawing.updateSpellsInfo(spellsInfo);


let lpX = 0.0;
let lpY = 0.0;

const drawingUtils = new DrawingUtils();
drawingUtils.initCanvas(canvas, context);
drawingUtils.initGridCanvas(canvasGrid, contextGrid);
drawingUtils.InitOurPlayerCanvas(canvasOurPlayer, contextOurPlayer);

function breakSpell(Parameters) {
  const playerId = Parameters[0];
  const spellId = Parameters[5];
  return { playerId, itemId: Parameters[6], targetId: Parameters[7], spellId };
}

const socket = new WebSocket("ws://localhost:5002");

socket.addEventListener("open", (event) => {
  console.log("Connected to the WebSocket server.");
});

socket.addEventListener("message", (event) => {
  var data = JSON.parse(event.data);

  // Extract the string and dictionary from the object
  var extractedString = data.code;

  var extractedDictionary = JSON.parse(data.dictionary);

  switch (extractedString) {
    case "request":
      onRequest(extractedDictionary["parameters"]);
      break;

    case "event":
      onEvent(extractedDictionary["parameters"]);
      break;

    case "response":
      onResponse(extractedDictionary["parameters"]);
      break;
  }
});

function onEvent(Parameters) {
  const id = parseInt(Parameters[0]);
  const eventCode = Parameters[252];

  switch (eventCode) {
    case EventCodes.NewHuntTrack:
      const trackPosX = Parameters[1][0];
      const trackPosY = Parameters[1][1];
      const name = Parameters[3];
      trackFootprintsHandler.addFootprint(id, trackPosX, trackPosY, name);
      break;

    case EventCodes.Leave:
      playersHandler.removePlayer(id);
      mobsHandler.removeMist(id);
      mobsHandler.removeMob(id);
      dungeonsHandler.RemoveDungeon(id);
      chestsHandler.removeChest(id);
      fishingHandler.RemoveFish(id);
      trackFootprintsHandler.removeFootprint(id);
      break;

    case EventCodes.Move:
      const posX = Parameters[4];
      const posY = Parameters[5];
      playersHandler.updatePlayerPosition(id, posX, posY);
      mobsHandler.updateMistPosition(id, posX, posY);
      mobsHandler.updateMobPosition(id, posX, posY);
      trackFootprintsHandler.updateFootprintPosition(id, posX, posY);
      break;

    case EventCodes.NewCharacter:
      playersHandler.handleNewPlayerEvent(Parameters);
      break;

    case EventCodes.NewSimpleHarvestableObjectList:
      harvestablesHandler.newSimpleHarvestableObject(Parameters);
      break;
      case EventCodes.NewSimpleHarvestableObject:
        break;
  
    case EventCodes.NewHarvestableObject:
      harvestablesHandler.newHarvestableObject(id, Parameters);
      break;

    case EventCodes.HarvestableChangeState:
      harvestablesHandler.HarvestUpdateEvent(Parameters);
      break;

    case EventCodes.HarvestFinished:
      harvestablesHandler.harvestFinished(Parameters);
      break;

    case EventCodes.MobChangeState:
      mobsHandler.updateEnchantEvent(Parameters);
      break;

    case EventCodes.RegenerationHealthChanged:
      playersHandler.UpdatePlayerHealth(Parameters);
      break;

    case EventCodes.CharacterEquipmentChanged:
      playersHandler.updateItems(id, Parameters);
      playersHandler.updateSpells(id, Parameters);
      break;

    case EventCodes.NewMob:
      mobsHandler.NewMobEvent(Parameters);
      break;

    case EventCodes.Mounted:
      playersHandler.handleMountedPlayerEvent(id, Parameters);
      break;

    case EventCodes.NewRandomDungeonExit:
      dungeonsHandler.dungeonEvent(Parameters);
      break;

    case EventCodes.NewLootChest:
      chestsHandler.addChestEvent(Parameters);
      break;

    case EventCodes.NewMistsCagedWisp:
      wispCageHandler.NewCageEvent(Parameters);
      break;

    case EventCodes.MistsWispCageOpened:
      wispCageHandler.CageOpenedEvent(Parameters);
      break;

    case EventCodes.CastStart:
      playersHandler.handleCastSpell(breakSpell(Parameters));
      break;

    // TODO
    case EventCodes.NewFishingZoneObject:
      fishingHandler.NewFishEvent(Parameters);
      break;

    // TODO
    case EventCodes.FishingFinished:
      fishingHandler.FishingEnd(Parameters);
      break;
      case EventCodes.CharacterStats:
        console.log("CharacerStatr",Parameters);
      break;

      case EventCodes.PartyInviteOrJoinPlayerEquipmentInfo:
        
        console.log("PartyInviteOrJoinPlayerEquipmentInfo",Parameters);
      break;
    default:
      break;
  }
}

function onRequest(Parameters) {
  // Player moving
  if (Parameters[253] == 21) {
    lpX = Parameters[1][0];
    lpY = Parameters[1][1];

    //console.log("X: " + lpX + ", Y: " + lpY);
  }
}

setTimeout(() => {
  //console.log(mobsHandler.mobsData);
}, 2000);

function onResponse(Parameters) {
  // Player join new map
  if (Parameters[253] == 35) {
    map.id = Parameters[0];
  }
  // All data on the player joining the map (us)
  else if (Parameters[253] == 2) {
    lpX = Parameters[9][0];
    lpY = Parameters[9][1];
  }
}

requestAnimationFrame(gameLoop);

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  contextMap.clearRect(0, 0, canvasMap.width, canvasMap.height);

  mapsDrawing.Draw(contextMap, map);

  harvestablesDrawing.invalidate(context, harvestablesHandler.harvestableList);

  mobsDrawing.invalidate(context, mobsHandler.mobsList, mobsHandler.mistList);
  chestsDrawing.invalidate(context, chestsHandler.chestsList);
  wispCageDrawing.Draw(context, wispCageHandler.cages);
  fishingDrawing.Draw(context, fishingHandler.fishes);
  dungeonsDrawing.Draw(context, dungeonsHandler.dungeonList);
  playersDrawing.invalidate(context, playersHandler.playersInRange,playersHandler.alreadyFilteredPlayers,playersHandler.filteredGuilds,playersHandler.filteredAlliances);
  trackFootprintsDrawing.invalidate(
    context,
    trackFootprintsHandler.getFootprintsList(),
  );
}

var previousTime = performance.now();

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function update() {
  const currentTime = performance.now();
  const deltaTime = currentTime - previousTime;
  const t = Math.min(1, deltaTime / 100);

  if (settings.showMapBackground) mapsDrawing.interpolate(map, lpX, lpY, t);

  harvestablesHandler.removeNotInRange(lpX, lpY);
  harvestablesDrawing.interpolate(
    harvestablesHandler.harvestableList,
    lpX,
    lpY,
    t,
  );

  mobsDrawing.interpolate(
    mobsHandler.mobsList,
    mobsHandler.mistList,
    lpX,
    lpY,
    t,
  );

  chestsDrawing.interpolate(chestsHandler.chestsList, lpX, lpY, t);
  wispCageHandler.removeNotInRange(lpX, lpY);
  wispCageDrawing.Interpolate(wispCageHandler.cages, lpX, lpY, t);
  fishingDrawing.Interpolate(fishingHandler.fishes, lpX, lpY, t);
  dungeonsDrawing.interpolate(dungeonsHandler.dungeonList, lpX, lpY, t);
  playersDrawing.interpolate(playersHandler.playersInRange, lpX, lpY, t);
  playersHandler.removeSpellsWithoutCooldown();
  trackFootprintsDrawing.interpolate(
    trackFootprintsHandler.getFootprintsList(),
    lpX,
    lpY,
    t,
  );

  previousTime = currentTime;
}

function drawItems() {
  contextItems.clearRect(0, 0, canvasItems.width, canvasItems.height);

  if (settings.settingItems) {
    playersDrawing.drawItems(
      contextItems,
      canvasItems,
      playersHandler.playersInRange,
      settings.settingItemsDev,
      playersHandler.castedSpells,
      settings.settingSpellsDev,
      playersHandler.alreadyFilteredPlayers,
      playersHandler.filteredGuilds,
      playersHandler.filteredAlliances
    );
  }
}
const intervalItems = 500;
let lastExecutionTime = 0;
function drawItemsWithInterval(timestamp) {
  if (timestamp - lastExecutionTime >= intervalItems) {
    drawItems();
    lastExecutionTime = timestamp;
  }
  requestAnimationFrame(drawItemsWithInterval);
}

requestAnimationFrame(drawItemsWithInterval);

function checkLocalStorage() {
  settings.update(settings);
}

const interval = 300;
setInterval(checkLocalStorage, interval);

document.getElementById("button").addEventListener("click", function () {
  chestsHandler.chestsList = [];
  dungeonsHandler.dungeonList = [];
  harvestablesHandler.harvestableList = [];
  mobsHandler.mobsList = [];
  mobsHandler.mistList = [];
  playersHandler.playersInRange = [];
  wispCageHandler.cages = [];
});

// Only the relevant modifications are shown here