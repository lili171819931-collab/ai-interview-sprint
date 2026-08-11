const electron = require("electron");
const path = require("path");
const fs = require("fs");

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  systemPreferences,
  Menu,
  session,
  desktopCapturer,
  Tray,
  nativeImage,
} = electron;

if (!app) {
  console.error(
    "[fatal] electron.app is undefined. require('electron') returned:",
    typeof electron,
    electron && Object.keys(electron).slice(0, 20),
  );
  process.exit(1);
}

const { spawn } = require("child_process");

// 防止最小化/隐藏后 RAF 被节流 → captureStream 卡静帧
try {
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.commandLine.appendSwitch("disable-background-timer-throttling");
  app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
} catch {
  // ignore
}

const isDev = process.env.ELECTRON_IS_DEV === "1" || !app.isPackaged;
let mainWindow = null;
let cameraPipWindow = null;
let controlBarWindow = null;
let cursorPushTimer = null;
let tray = null;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function rebuildTray(recording) {
  if (process.platform !== "darwin") return;
  try {
    if (!tray) {
      // 1x1 template-ish dot; macOS will render in menu bar
      const img = nativeImage.createEmpty();
      tray = new Tray(img.isEmpty() ? nativeImage.createFromDataURL(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAPElEQVQoz2NgGAWjYBSMglEwCkbBKBgFg8JAQUEB/x8YGBjg4uLi/4GBgQEuLi7+PzAwMMDFxcX/BwcH/wcA8p0GAa1oGqkAAAAASUVORK5CYII=",
      ) : img);
      tray.setToolTip("Mac Screen Cam Recorder");
    }
    const showBar = {
      label: "显示操作条",
      click: () => setControlBarVisible(true),
    };
    const showMain = {
      label: "显示主窗口",
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    };
    const items = recording
      ? [
          { label: "● 录制中", enabled: false },
          {
            label: "暂停 / 继续",
            click: () => sendToRenderer("tray-action", "toggle-pause"),
          },
          {
            label: "录制中快拍截图",
            click: () => sendToRenderer("tray-action", "screenshot"),
          },
          {
            label: "停止并保存",
            click: () => sendToRenderer("tray-action", "stop"),
          },
          { type: "separator" },
          showMain,
          showBar,
        ]
      : [
          showMain,
          showBar,
          {
            label: "截图（当前预览）",
            click: () => sendToRenderer("tray-action", "screenshot"),
          },
          {
            label: "开始/停止录制",
            click: () => sendToRenderer("tray-action", "toggle-record"),
          },
          {
            label: "打开桌面/Mac录屏",
            click: () => shell.openPath(getOrCreateExportDir()),
          },
          { type: "separator" },
          { role: "quit", label: "退出" },
        ];
    tray.setContextMenu(Menu.buildFromTemplate(items));
  } catch (err) {
    console.warn("[tray]", err);
  }
}

function setRecordingState(recording) {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setBadge(recording ? "REC" : "");
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(
      recording ? "● 录制中 — Mac Screen Cam Recorder" : "Mac Screen Cam Recorder",
    );
  }
  rebuildTray(Boolean(recording));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 640,
    minWidth: 360,
    minHeight: 520,
    backgroundColor: "#111317",
    title: "Mac Screen Cam Recorder",
    trafficLightPosition: { x: 12, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  try {
    mainWindow.webContents.setBackgroundThrottling(false);
  } catch {
    // ignore
  }

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5177");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    releaseRendererMedia();
    mainWindow = null;
    closeCameraPip();
    closeControlBar();
  });
}

function ensureCameraPip() {
  if (cameraPipWindow && !cameraPipWindow.isDestroyed()) return cameraPipWindow;
  cameraPipWindow = new BrowserWindow({
    width: 176,
    height: 176,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload-pip.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  cameraPipWindow.setAlwaysOnTop(true, "floating");
  cameraPipWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // 避免被系统截屏/录屏抓到，防止成片里出现「双圆窗」；成片圆窗仍由主窗口 Canvas 合成
  try {
    cameraPipWindow.setContentProtection(true);
  } catch {
    // ignore
  }
  cameraPipWindow.loadFile(path.join(__dirname, "camera-pip.html"));
  cameraPipWindow.on("closed", () => {
    cameraPipWindow = null;
  });
  return cameraPipWindow;
}

function closeCameraPip() {
  if (cameraPipWindow && !cameraPipWindow.isDestroyed()) {
    cameraPipWindow.close();
  }
  cameraPipWindow = null;
}

async function setCameraPipVisible(visible, deviceId) {
  if (!visible) {
    if (cameraPipWindow && !cameraPipWindow.isDestroyed()) {
      cameraPipWindow.webContents.send("camera-pip-command", { type: "stop" });
      cameraPipWindow.hide();
    }
    return true;
  }
  const win = ensureCameraPip();
  if (!win.isVisible()) {
    // 默认右下角，避开 Dock
    const { screen } = electron;
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workArea;
    const { x: ox, y: oy } = display.workArea;
    win.setPosition(ox + width - 200, oy + height - 220);
    win.showInactive();
  }
  const sendStart = () =>
    win.webContents.send("camera-pip-command", { type: "start", deviceId: deviceId || "" });
  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", sendStart);
  } else {
    sendStart();
  }
  return true;
}

function ensureControlBar() {
  if (controlBarWindow && !controlBarWindow.isDestroyed()) return controlBarWindow;
  controlBarWindow = new BrowserWindow({
    width: 580,
    height: 58,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload-control.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  controlBarWindow.setAlwaysOnTop(true, "screen-saver");
  controlBarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  try {
    controlBarWindow.setContentProtection(true);
  } catch {
    // ignore
  }
  controlBarWindow.loadFile(path.join(__dirname, "control-bar.html"));
  controlBarWindow.on("closed", () => {
    controlBarWindow = null;
  });
  return controlBarWindow;
}

function closeControlBar() {
  stopCursorPush();
  if (controlBarWindow && !controlBarWindow.isDestroyed()) {
    controlBarWindow.close();
  }
  controlBarWindow = null;
}

function setControlBarVisible(visible) {
  if (!visible) {
    if (controlBarWindow && !controlBarWindow.isDestroyed()) {
      controlBarWindow.hide();
    }
    return true;
  }
  const win = ensureControlBar();
  if (!win.isVisible()) {
    const { screen } = electron;
    const display = screen.getPrimaryDisplay();
    const { width, x: ox, y: oy } = display.workArea;
    win.setPosition(ox + Math.round((width - 580) / 2), oy + 18);
    win.showInactive();
  }
  return true;
}

function pushControlBarState(state) {
  if (controlBarWindow && !controlBarWindow.isDestroyed()) {
    controlBarWindow.webContents.send("control-bar-state", state || {});
  }
}

function startCursorPush() {
  if (cursorPushTimer) return;
  const { screen } = electron;
  cursorPushTimer = setInterval(() => {
    try {
      const p = screen.getCursorScreenPoint();
      const d = screen.getDisplayNearestPoint(p);
      sendToRenderer("cursor-pos", {
        x: p.x,
        y: p.y,
        displayX: d.bounds.x,
        displayY: d.bounds.y,
        displayW: d.bounds.width,
        displayH: d.bounds.height,
      });
    } catch {
      // ignore
    }
  }, 32);
}

function stopCursorPush() {
  if (cursorPushTimer) {
    clearInterval(cursorPushTimer);
    cursorPushTimer = null;
  }
}

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "打开系统隐私设置（屏幕录制）",
          click: () => {
            shell.openExternal(
              "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
            );
          },
        },
        {
          label: "打开系统隐私设置（摄像头）",
          click: () => {
            shell.openExternal(
              "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera",
            );
          },
        },
        {
          label: "打开系统隐私设置（麦克风）",
          click: () => {
            shell.openExternal(
              "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
            );
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function formatStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** 桌面/Mac录屏 — 不存在则创建 */
function getOrCreateExportDir() {
  const dir = path.join(app.getPath("desktop"), "Mac录屏");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function findFfmpeg() {
  const candidates = [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "ffmpeg",
  ];
  for (const bin of candidates) {
    try {
      if (bin === "ffmpeg") return bin;
      if (fs.existsSync(bin)) return bin;
    } catch {
      // ignore
    }
  }
  return "ffmpeg";
}

function runFfmpegToMp4(inputPath, outputPath) {
  const bin = findFfmpeg();
  const commonTail = ["-movflags", "+faststart", "-y", outputPath];
  const attempts = [
    // 明确按 webm 解复用，避免嗅探失败
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-fflags",
      "+genpts",
      "-f",
      "webm",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      ...commonTail,
    ],
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      ...commonTail,
    ],
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-c:v",
      "h264_videotoolbox",
      "-b:v",
      "8M",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      ...commonTail,
    ],
  ];

  const runOnce = (args) =>
    new Promise((resolve, reject) => {
      const child = spawn(bin, args, {
        stdio: ["ignore", "ignore", "pipe"],
        env: {
          ...process.env,
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
        },
      });
      let err = "";
      child.stderr.on("data", (d) => {
        err += String(d);
      });
      child.on("error", (e) => reject(e));
      child.on("close", (code) => {
        if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 64) {
          resolve(outputPath);
        } else {
          reject(new Error(err.slice(-1200) || `ffmpeg exit ${code}`));
        }
      });
    });

  let chain = Promise.reject(new Error("init"));
  for (const args of attempts) {
    chain = chain.catch(() => runOnce(args));
  }
  return chain;
}

function bufferLooksLikeMp4(buf) {
  if (!buf || buf.length < 12) return false;
  // ....ftyp
  return buf.slice(4, 8).toString("ascii") === "ftyp";
}

function fileLooksLikeMp4(filePath) {
  try {
    const fd = fs.openSync(filePath, "r");
    try {
      const head = Buffer.alloc(12);
      const n = fs.readSync(fd, head, 0, 12, 0);
      return n >= 12 && bufferLooksLikeMp4(head);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

function releaseRendererMedia() {
  stopCursorPush();
  sendToRenderer("release-media");
  closeCameraPip();
  closeControlBar();
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allow = ["media", "mediaKeySystem", "display-capture", "fullscreen"].includes(
      permission,
    );
    callback(allow);
  });

  // macOS 系统选择器：useSystemPicker 时尽量不要用 desktopCapturer 覆盖成「假直播」静止源。
  // 旧系统仍 fallback 到第一个 screen。
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        // 让系统选择器决定源；若 handler 仍被调用，提供 live screen 列表首项
        const sources = await desktopCapturer.getSources({
          types: ["screen"],
          thumbnailSize: { width: 0, height: 0 },
        });
        const screenSrc = sources.find((s) => String(s.id).startsWith("screen:")) || sources[0];
        if (!screenSrc) {
          callback({});
          return;
        }
        callback({ video: screenSrc });
      } catch {
        callback({});
      }
    },
    { useSystemPicker: true },
  );

  buildMenu();
  try {
    getOrCreateExportDir();
  } catch {
    // ignore
  }
  createWindow();
  rebuildTray(false);
  registerGlobalShortcuts();
  // 启动即常驻教学操作条
  setControlBarVisible(true);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-sources", async (_event, { types }) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: types || ["screen", "window"],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });
    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      display_id: s.display_id,
      thumbnailDataUrl: s.thumbnail.toDataURL(),
    }));
  } catch (err) {
    console.warn(
      "[get-sources] failed (grant Screen Recording to Electron, then restart):",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
});

ipcMain.handle("get-media-access-status", async (_event, mediaType) => {
  if (process.platform !== "darwin") return "unknown";
  try {
    if (mediaType === "screen") {
      // Electron + 新版 macOS 上 getMediaAccessStatus('screen') 经常误报 denied。
      // 用 desktopCapturer 探测做校正；探测失败也不直接当成「未开启」。
      const api = systemPreferences.getMediaAccessStatus("screen");
      if (api === "granted") return "granted";
      try {
        const sources = await desktopCapturer.getSources({
          types: ["screen"],
          thumbnailSize: { width: 1, height: 1 },
        });
        if (sources.length > 0) return "granted";
      } catch {
        // ignore
      }
      // api 为 denied/restricted 时，对开发态 Electron 不可靠 → 返回 not-determined 让 UI 提示「去验证」
      if (api === "denied" || api === "restricted") return "not-determined";
      return api || "not-determined";
    }
    return systemPreferences.getMediaAccessStatus(mediaType);
  } catch {
    return "unknown";
  }
});

ipcMain.handle("ask-media-access", async (_event, mediaType) => {
  if (process.platform !== "darwin") return true;
  if (mediaType === "screen") {
    // 屏幕录制不能 askForMediaAccess；以探测为准
    const status = await (async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ["screen"],
          thumbnailSize: { width: 1, height: 1 },
        });
        return sources.length > 0;
      } catch {
        return systemPreferences.getMediaAccessStatus("screen") === "granted";
      }
    })();
    return status;
  }
  try {
    return await systemPreferences.askForMediaAccess(mediaType);
  } catch {
    return false;
  }
});

ipcMain.handle("open-privacy-settings", async (_event, which) => {
  // macOS 新设置 App 与旧面板 deep link 都试一遍
  const candidates = {
    screen: [
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
      "x-apple.systempreferences:com.apple.Settings.PrivacySecurity.extension?Privacy_ScreenCapture",
    ],
    camera: [
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera",
      "x-apple.systempreferences:com.apple.Settings.PrivacySecurity.extension?Privacy_Camera",
    ],
    microphone: [
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
      "x-apple.systempreferences:com.apple.Settings.PrivacySecurity.extension?Privacy_Microphone",
    ],
  };
  const list = candidates[which] || candidates.screen;
  for (const url of list) {
    try {
      await shell.openExternal(url);
      break;
    } catch {
      // try next
    }
  }
});

ipcMain.handle("set-recording-state", (_event, recording) => {
  setRecordingState(Boolean(recording));
  return true;
});

ipcMain.handle("save-recording", async (_event, payload) => {
  const { buffer, sidecar, fileName, mimeType } = payload || {};
  const dir = getOrCreateExportDir();
  const raw =
    (fileName && String(fileName)) || `${formatStamp()}-screen-cam.mp4`;
  const base = raw.replace(/[^\w.\u4e00-\u9fff-]+/g, "_").replace(/\.(webm|mp4)$/i, "");
  const mp4Name = `${base}.mp4`;
  const mp4Path = path.join(dir, mp4Name);
  const buf = Buffer.from(buffer);

  const writeSidecar = (filePath, extra = {}) => {
    if (!sidecar) return;
    const sidePath = filePath.replace(/\.[^.]+$/, ".json");
    fs.writeFileSync(
      sidePath,
      JSON.stringify({ ...sidecar, format: "mp4", ...extra }, null, 2),
      "utf8",
    );
  };

  // 仅当字节确为 MP4（ftyp）时直接落盘；勿信 mimeType——Electron 常报 mp4 却写出 webm，
  // 若直接改后缀为 .mp4，系统会当「网页视频」用浏览器打开。
  if (bufferLooksLikeMp4(buf)) {
    fs.writeFileSync(mp4Path, buf);
    writeSidecar(mp4Path, {
      encode: "native-mp4",
      sourceMime: mimeType || null,
    });
    return { ok: true, filePath: mp4Path, dir, format: "mp4" };
  }

  const tmpWebm = path.join(dir, `.${base}-${Date.now()}.webm`);
  fs.writeFileSync(tmpWebm, buf);
  try {
    await runFfmpegToMp4(tmpWebm, mp4Path);
    try {
      fs.unlinkSync(tmpWebm);
    } catch {
      // ignore
    }
    if (!fileLooksLikeMp4(mp4Path)) {
      try {
        fs.unlinkSync(mp4Path);
      } catch {
        // ignore
      }
      throw new Error("ffmpeg 输出不是有效 MP4");
    }
    writeSidecar(mp4Path, {
      encode: "ffmpeg-h264",
      sourceMime: mimeType || null,
    });
    return { ok: true, filePath: mp4Path, dir, format: "mp4" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[save-recording] mp4 convert failed:", msg);
    try {
      fs.unlinkSync(tmpWebm);
    } catch {
      // ignore
    }
    return {
      ok: false,
      dir,
      error: `MP4 转码失败（未写入 WebM）：${msg}。请确认已安装 ffmpeg：brew install ffmpeg`,
    };
  }
});

ipcMain.handle("show-in-folder", async (_event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle("get-default-export-dir", () => getOrCreateExportDir());

ipcMain.handle("open-export-dir", async () => {
  const dir = getOrCreateExportDir();
  await shell.openPath(dir);
  return dir;
});

ipcMain.handle("list-recordings", async () => {
  const dir = getOrCreateExportDir();
  try {
    const names = fs.readdirSync(dir);
    const items = names
      .filter((n) => /\.(webm|mp4|mov|png|jpe?g|webp)$/i.test(n))
      .map((name) => {
        const filePath = path.join(dir, name);
        const st = fs.statSync(filePath);
        const kind = /\.(png|jpe?g|webp)$/i.test(name) ? "screenshot" : "recording";
        return {
          name,
          filePath,
          sizeBytes: st.size,
          createdAt: st.mtimeMs,
          kind,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 48);
    return { dir, items };
  } catch {
    return { dir, items: [] };
  }
});

ipcMain.handle("save-screenshot", async (_event, payload) => {
  const { buffer, fileName, copyToClipboard = true } = payload || {};
  const dir = getOrCreateExportDir();
  const raw =
    (fileName && String(fileName)) || `${formatStamp()}-screenshot.png`;
  const base = raw.replace(/[^\w.\u4e00-\u9fff-]+/g, "_");
  const filePath = path.join(dir, base.endsWith(".png") ? base : `${base}.png`);
  const buf = Buffer.from(buffer);
  fs.writeFileSync(filePath, buf);
  if (copyToClipboard) {
    const { clipboard } = electron;
    clipboard.writeImage(nativeImage.createFromBuffer(buf));
  }
  return { ok: true, filePath, dir };
});

ipcMain.handle("delete-capture", async (_event, filePath) => {
  try {
    if (!filePath || typeof filePath !== "string") return { ok: false };
    const dir = getOrCreateExportDir();
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
      return { ok: false, error: "path-outside-export-dir" };
    }
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
    const side = resolved.replace(/\.[^.]+$/, ".json");
    if (fs.existsSync(side)) fs.unlinkSync(side);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle("open-capture", async (_event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return false;
  let target = filePath;
  if (/\.webm$/i.test(filePath)) {
    const mp4Path = filePath.replace(/\.webm$/i, ".mp4");
    try {
      if (!fs.existsSync(mp4Path) || fs.statSync(mp4Path).size < 64) {
        await runFfmpegToMp4(filePath, mp4Path);
      }
      target = mp4Path;
    } catch (e) {
      console.error("[open-capture] webm→mp4 failed", e);
    }
  }
  if (/\.mp4$/i.test(target)) {
    try {
      const child = spawn("open", ["-a", "QuickTime Player", target], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      return true;
    } catch {
      // fall through
    }
  }
  const err = await shell.openPath(target);
  return !err;
});

ipcMain.handle("copy-image-file", async (_event, filePath) => {
  const { clipboard } = electron;
  if (!filePath || !fs.existsSync(filePath)) return false;
  if (!/\.(png|jpe?g|webp)$/i.test(filePath)) return false;
  clipboard.writeImage(nativeImage.createFromPath(filePath));
  return true;
});

ipcMain.handle("set-camera-pip", async (_event, payload) => {
  const visible = Boolean(payload?.visible);
  const deviceId = typeof payload?.deviceId === "string" ? payload.deviceId : "";
  return setCameraPipVisible(visible, deviceId);
});

ipcMain.handle("camera-pip-hide", () => {
  if (cameraPipWindow && !cameraPipWindow.isDestroyed()) {
    cameraPipWindow.webContents.send("camera-pip-command", { type: "stop" });
    cameraPipWindow.hide();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("camera-pip-dismissed");
  }
  return true;
});

ipcMain.handle("set-main-window-visible", (_event, visible) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  try {
    mainWindow.webContents.setBackgroundThrottling(false);
  } catch {
    // ignore
  }
  if (visible) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    // hide + 关闭后台节流，保证合成 RAF/定时器持续跑，避免静帧
    mainWindow.hide();
  }
  return true;
});

ipcMain.handle("set-control-bar", (_event, payload) => {
  const visible = Boolean(payload?.visible);
  setControlBarVisible(visible);
  if (payload?.state) pushControlBarState(payload.state);
  return true;
});

ipcMain.handle("push-control-bar-state", (_event, state) => {
  pushControlBarState(state || {});
  return true;
});

ipcMain.handle("control-bar-action", (_event, action) => {
  const act = String(action || "");
  if (act === "close-app") {
    app.quit();
    return true;
  }
  if (act === "minimize-bar") {
    if (controlBarWindow && !controlBarWindow.isDestroyed()) {
      controlBarWindow.hide();
    }
    return true;
  }
  if (act === "show-main") {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
    return true;
  }
  sendToRenderer("tray-action", act);
  return true;
});

ipcMain.handle("set-shell-expanded", (_event, expanded) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  if (expanded) {
    mainWindow.setMinimumSize(720, 560);
    mainWindow.setSize(1100, 760);
  } else {
    mainWindow.setMinimumSize(360, 520);
    mainWindow.setSize(400, 640);
  }
  return true;
});

ipcMain.handle("set-cursor-tracking", (_event, enabled) => {
  if (enabled) startCursorPush();
  else stopCursorPush();
  return true;
});

ipcMain.handle("copy-text", (_event, text) => {
  const { clipboard } = electron;
  clipboard.writeText(String(text || ""));
  return true;
});

function registerGlobalShortcuts() {
  const { globalShortcut } = electron;
  globalShortcut.unregisterAll();
  // 避开系统 ⇧⌘3/4/5；用 Snapzy 风格可记组合
  const okRecord = globalShortcut.register("Command+Shift+Alt+R", () => {
    sendToRenderer("tray-action", "toggle-record");
  });
  const okShot = globalShortcut.register("Command+Shift+Alt+S", () => {
    sendToRenderer("tray-action", "screenshot");
  });
  const okStop = globalShortcut.register("Command+Shift+Alt+.", () => {
    sendToRenderer("tray-action", "stop");
  });
  console.log("[shortcuts]", { okRecord, okShot, okStop });
}

app.on("will-quit", () => {
  releaseRendererMedia();
  try {
    electron.globalShortcut.unregisterAll();
  } catch {
    // ignore
  }
});

app.on("before-quit", () => {
  releaseRendererMedia();
});
