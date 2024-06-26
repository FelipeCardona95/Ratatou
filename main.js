const { app, BrowserWindow, ipcMain } = require("electron");
const express = require("express");
const ejs = require("ejs");
const path = require("path");
const PhotonParser = require("./scripts/classes/PhotonPacketParser");
const Cap = require("cap").Cap;
const decoders = require("cap").decoders;
const WebSocket = require("ws");
const fs = require("fs");
const { getAdapterIp } = require("./server-scripts/adapter-selector");

let mainWindow;
let drawingWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL("http://localhost:5001/");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  mainWindow.webContents.session.clearCache();
}

function createDrawingWindow() {
  drawingWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  drawingWindow.loadURL("http://localhost:5001/drawing");

  drawingWindow.on("closed", function () {
    drawingWindow = null;
  });

  drawingWindow.maximize();
  //remove this to make interactabkle
  drawingWindow.setIgnoreMouseEvents(true, { forward: true });
}

ipcMain.on("open-drawing-window", (event, arg) => {
  createDrawingWindow();
});

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Express setup
const expressApp = express();
const port = 5001;

BigInt.prototype.toJSON = function () {
  return this.toString();
};

expressApp.use(express.static(__dirname + "/views"));
expressApp.set("view engine", "ejs");

expressApp.get("/", (req, res) => {
  const viewName = "main/home";
  res.render("layout", { mainContent: viewName });
});

expressApp.get("/home", (req, res) => {
  const viewName = "main/home";
  res.render("./layout", { mainContent: viewName });
});

expressApp.get("/resources", (req, res) => {
  const viewName = "main/resources";
  res.render("layout", { mainContent: viewName });
});

expressApp.get("/enemies", (req, res) => {
  const viewName = "main/enemies";
  res.render("layout", { mainContent: viewName });
});

expressApp.get("/chests", (req, res) => {
  const viewName = "main/chests";
  res.render("layout", { mainContent: viewName });
});

expressApp.get("/map", (req, res) => {
  const viewName = "main/map";
  const viewRequireName = "main/require-map";

  fs.access("./images/Maps", function (error) {
    if (error) {
      res.render("layout", { mainContent: viewRequireName });
    } else {
      res.render("layout", { mainContent: viewName });
    }
  });
});

expressApp.get("/ignorelist", (req, res) => {
  const viewName = "main/ignorelist";
  res.render("layout", { mainContent: viewName });
});

expressApp.get("/drawing", (req, res) => {
  res.render("main/drawing");
});

expressApp.use("/scripts", express.static(__dirname + "/scripts"));
expressApp.use(
  "/scripts/Handlers",
  express.static(__dirname + "/scripts/Handlers")
);
expressApp.use(
  "/scripts/Drawings",
  express.static(__dirname + "/scripts/Drawings")
);
expressApp.use("/scripts/Utils", express.static(__dirname + "/scripts/Utils"));
expressApp.use(
  "/images/Resources",
  express.static(__dirname + "/images/Resources")
);
expressApp.use("/images/Mobs", express.static(__dirname + "/images/Mobs"));
expressApp.use("/images/Maps", express.static(__dirname + "/images/Maps"));
expressApp.use("/images/Items", express.static(__dirname + "/images/Items"));
expressApp.use("/images/Spells", express.static(__dirname + "/images/Spells"));
expressApp.use("/images/Flags", express.static(__dirname + "/images/Flags"));
expressApp.use("/sounds", express.static(__dirname + "/sounds"));
expressApp.use("/config", express.static(__dirname + "/config"));

expressApp.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Cap and WebSocket setup
var c = new Cap();

let adapterIp;

if (fs.existsSync("ip.txt"))
  adapterIp = fs.readFileSync("ip.txt", { encoding: "utf-8", flag: "r" });

if (!adapterIp) {
  adapterIp = getAdapterIp();
} else {
  console.log();
  console.log(`Using last adapter selected - ${adapterIp}`);
  console.log('If you want to change adapter, delete the  "ip.txt"  file.');
  console.log();
}

let device = Cap.findDevice(adapterIp);

if (device == undefined) {
  console.log();
  console.log(`Last adapter is not working, please choose a new one.`);
  console.log();

  adapterIp = getAdapterIp();
  device = Cap.findDevice(adapterIp);
}

const filter = "udp and (dst port 5056 or src port 5056)";
var bufSize = 4096;
var buffer = Buffer.alloc(4096);
const manager = new PhotonParser();
var linkType = c.open(device, filter, bufSize, buffer);

c.setMinBytes && c.setMinBytes(0);

// setup Cap event listener on global level
c.on("packet", function (nbytes, trunc) {
  let ret = decoders.Ethernet(buffer);
  ret = decoders.IPV4(buffer, ret.offset);
  ret = decoders.UDP(buffer, ret.offset);

  let payload = buffer.slice(ret.offset, nbytes);

  // Parse the UDP payload
  try {
    manager.handle(payload);
  } catch {}
});

const server = new WebSocket.Server({ port: 5002, host: "localhost" });
server.on("listening", () => {
  manager.on("event", (dictionary) => {
    const dictionaryDataJSON = JSON.stringify(dictionary);
    server.clients.forEach(function (client) {
      client.send(
        JSON.stringify({ code: "event", dictionary: dictionaryDataJSON })
      );
    });
  });

  manager.on("request", (dictionary) => {
    const dictionaryDataJSON = JSON.stringify(dictionary);
    server.clients.forEach(function (client) {
      client.send(
        JSON.stringify({ code: "request", dictionary: dictionaryDataJSON })
      );
    });
  });

  manager.on("response", (dictionary) => {
    const dictionaryDataJSON = JSON.stringify(dictionary);
    server.clients.forEach(function (client) {
      client.send(
        JSON.stringify({ code: "response", dictionary: dictionaryDataJSON })
      );
    });
  });
});

server.on("close", () => {
  console.log("closed");
  manager.removeAllListeners();
});
