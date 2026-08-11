const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("macRecorder", {
  getSources: (types) => ipcRenderer.invoke("get-sources", { types }),
  getMediaAccessStatus: (mediaType) =>
    ipcRenderer.invoke("get-media-access-status", mediaType),
  askMediaAccess: (mediaType) => ipcRenderer.invoke("ask-media-access", mediaType),
  openPrivacySettings: (which) => ipcRenderer.invoke("open-privacy-settings", which),
  setRecordingState: (recording) =>
    ipcRenderer.invoke("set-recording-state", recording),
  saveRecording: (payload) => ipcRenderer.invoke("save-recording", payload),
  saveScreenshot: (payload) => ipcRenderer.invoke("save-screenshot", payload),
  showInFolder: (filePath) => ipcRenderer.invoke("show-in-folder", filePath),
  openCapture: (filePath) => ipcRenderer.invoke("open-capture", filePath),
  deleteCapture: (filePath) => ipcRenderer.invoke("delete-capture", filePath),
  copyImageFile: (filePath) => ipcRenderer.invoke("copy-image-file", filePath),
  getDefaultExportDir: () => ipcRenderer.invoke("get-default-export-dir"),
  openExportDir: () => ipcRenderer.invoke("open-export-dir"),
  listRecordings: () => ipcRenderer.invoke("list-recordings"),
  setMainWindowVisible: (visible) =>
    ipcRenderer.invoke("set-main-window-visible", visible),
  setCameraPip: (payload) => ipcRenderer.invoke("set-camera-pip", payload),
  setControlBar: (payload) => ipcRenderer.invoke("set-control-bar", payload),
  pushControlBarState: (state) => ipcRenderer.invoke("push-control-bar-state", state),
  setCursorTracking: (enabled) => ipcRenderer.invoke("set-cursor-tracking", enabled),
  setShellExpanded: (expanded) => ipcRenderer.invoke("set-shell-expanded", expanded),
  copyText: (text) => ipcRenderer.invoke("copy-text", text),
  onCameraPipDismissed: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("camera-pip-dismissed", handler);
    return () => ipcRenderer.removeListener("camera-pip-dismissed", handler);
  },
  onCameraPipMoved: (cb) => {
    const handler = (_e, pos) => cb(pos);
    ipcRenderer.on("camera-pip-moved", handler);
    return () => ipcRenderer.removeListener("camera-pip-moved", handler);
  },
  onTrayAction: (cb) => {
    const handler = (_e, action) => cb(action);
    ipcRenderer.on("tray-action", handler);
    return () => ipcRenderer.removeListener("tray-action", handler);
  },
  onReleaseMedia: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("release-media", handler);
    return () => ipcRenderer.removeListener("release-media", handler);
  },
  onCursorPos: (cb) => {
    const handler = (_e, pos) => cb(pos);
    ipcRenderer.on("cursor-pos", handler);
    return () => ipcRenderer.removeListener("cursor-pos", handler);
  },
});
