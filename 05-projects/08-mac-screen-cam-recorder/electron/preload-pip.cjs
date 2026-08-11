const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("macRecorderPip", {
  sendAction: (action) => ipcRenderer.invoke("camera-pip-action", action),
  hide: () => ipcRenderer.invoke("camera-pip-hide"),
  onCommand: (cb) => {
    const handler = (_e, cmd) => cb(cmd);
    ipcRenderer.on("camera-pip-command", handler);
    return () => ipcRenderer.removeListener("camera-pip-command", handler);
  },
});
