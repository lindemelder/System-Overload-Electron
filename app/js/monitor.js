const path = require("path");
const { ipcRenderer, ipcMain } = require("electron");
const osu = require("node-os-utils");
const cpu = osu.cpu;
const mem = osu.mem;
const os = osu.os;
const notifier = require("node-notifier");

let cpuOverload;
let alertFrequency;

//get settings & values
ipcRenderer.on("settings:get", (e, settings) => {
  cpuOverload = +settings.cpuOverload;
  alertFrequency = +settings.alertFrequency;
});

//interval run time every 2 secs
setInterval(() => {
  //CPU usage, returns a promise
  cpu.usage().then((info) => {
    document.getElementById("cpu-usage").innerText = info + "%";

    //cpu overload progress bar
    document.getElementById("cpu-progress").style.width = info + "%";

    //progress bar red if overload
    if (info >= cpuOverload) {
      document.getElementById("cpu-progress").style.background = "red";
    } else {
      document.getElementById("cpu-progress").style.background = "#30c88b";
    }
    if (info >= cpuOverload && runNotify(alertFrequency)) {
      //notify user
      notifyUser({
        title: "CPU overload",
        body: `CPU is over ${cpuOverload}%`,
      });
      localStorage.setItem("lastNotify", +new Date());
    }
  });

  //cpu free %
  cpu.free().then((info) => {
    document.getElementById("cpu-free").innerText = info + "%";
  });

  //function call for uptime
  document.getElementById("sys-uptime").innerText = secondsToDhms(os.uptime());
}, 2000);

//Static system Statistics:
//sets comp info/model
document.getElementById("cpu-model").innerText = cpu.model();

//Computer name
document.getElementById("comp-name").innerText = os.hostname();

// OS
document.getElementById("os").innerText = `${os.type()} ${os.arch()}`;

//Total memory in MBs
mem.info().then((info) => {
  document.getElementById("mem-total").innerText = `${info.totalMemMb} MB`;
});

//show days/hours/minutes/secs uptime
function secondsToDhms(seconds) {
  seconds = +seconds;
  //seconds/day * hours in day
  const day = Math.floor(seconds / (3600 * 24));
  const hour = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${day} days, ${hour} hrs, ${minutes} mins, ${secs} secs`;
}

//Send notification, using node-notifier

function notifyUser(options) {
  notifier.notify(
    {
      title: options.title,
      message: options.body,
      icon: path.join(__dirname, "img", "icon.png"), // Absolute path (doesn't work on balloons)
      sound: true, // Only Notification Center or Windows Toasters
      wait: true, // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
    },
    function (err, response) {
      // Response is response from notification
    }
  );
}

//interval check for notification
// function runNotify(frequency) {
//   if (localStorage.getItem("lastNotify" === null)) {
//     //store timestamp
//     localStorage.setItem("lastNotify", +new Date());
//     return true;
//   }
//   const notifyTime = new Date(parseInt(localStorage.getItem("lastNotify")));
//   const now = new Date();
//   const diffTime = Math.abs(now - notifyTime);
//   const minutesPassed = Math.ceil(diffTime / (1000 * 60));

//   if (minutesPassed > frequency) {
//     return true;
//   } else {
//     return false;
//   }
// }
function runNotify(frequency) {
  if (localStorage.getItem("lastNotify") === null) {
    // Store timestamp
    localStorage.setItem("lastNotify", +new Date());
    return true;
  }
  const notifyTime = new Date(parseInt(localStorage.getItem("lastNotify")));
  const now = new Date();
  const diffTime = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diffTime / (1000 * 60));

  if (minutesPassed > frequency) {
    return true;
  } else {
    return false;
  }
}
