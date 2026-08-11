const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("macRecorderPip", {
  hide: () => ipcRenderer.invoke("camera-pip-hide"),
  onCommand: (cb) => {
    const handler = (_e, cmd) => cb(cmd);
    ipcRenderer.on("camera-pip-command", handler);
    return () => ipcRenderer.removeListener("camera-pip-command", handler);
  },
});
