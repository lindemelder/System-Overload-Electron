const path = require("path");
const { app, BrowserWindow, Menu, ipcMain, Tray } = require("electron");
const log = require("electron-log");

const Store = require("./Store");
// Set env
process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "development" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let tray;

//Init store & defaults
const store = new Store({
  configName: "user-settings",
  defaults: {
    settings: {
      cpuOverload: 80,
      alertFrequency: 5,
    },
  },
});

//main window function
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "SYS-TOP",
    width: isDev ? 800 : 355,
    height: 550,
    icon: "./assets/icons/icon.png",
    resizable: isDev,
    opacity: 0.9,
    //allows usage of node and intro of modules to proj
    webPreferences: {
      nodeIntegration: true,
    },
  });
  //open dev tools auto in devmode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  //load html
  mainWindow.loadFile("./app/index.html");
}

app.on("ready", () => {
  createMainWindow();

  //settings
  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("settings:get", store.get("settings"));
  });
  //tray icon
  const icon = path.join(__dirname, "assets", "icons", "tray_icon.png");
  // tray
  tray = new Tray(icon);
  //display or minimize window to tray
  tray.on("click", () => {
    if (mainWindow.isVisible() === true) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
  //menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
});

//menu specs
const menu = [
  ...(isMac ? [{ role: "appMenu" }] : []),
  {
    role: "fileMenu",
  },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

//set settings
ipcMain.on("settings:set", (e, settingsValue) => {
  store.set("settings", settingsValue);
  mainWindow.webContents.send("settings:get", store.get("settings"));
});

//Mac specifics, to ensure that if app is in docker, new window won't open
app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.allowRendererProcessReuse = true;
