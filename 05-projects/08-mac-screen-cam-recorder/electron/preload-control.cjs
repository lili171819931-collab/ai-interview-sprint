const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("macRecorderBar", {
  sendAction: (action) => ipcRenderer.invoke("control-bar-action", action),
  onState: (cb) => {
    const handler = (_e, st) => cb(st);
    ipcRenderer.on("control-bar-state", handler);
    return () => ipcRenderer.removeListener("control-bar-state", handler);
  },
});
