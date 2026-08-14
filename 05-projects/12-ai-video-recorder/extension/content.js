/* ============================================================
 * AI Video Recorder — 网页内悬浮录制层（content script）
 * 融合 OBS（来源开关/混音）/ Cap（浮窗+圆形小窗）/ OpenScreen（形状/自动缩放/点击特效）/ Recordly（时间线/字幕）
 * 在真实网页上直接操作：工具栏 + 摄像头小窗悬浮于页面，录制页面本身。
 * ============================================================ */
(() => {
  "use strict";
  if (window.__aiRecorderInjected) return;
  window.__aiRecorderInjected = true;

  const IDLE = 0, REC = 1, PAUSED = 2;
  let state = IDLE;

  let screenStream = null, camStream = null, micStream = null;
  let canvas = null, ctx = null, raf = 0;
  let recorder = null, chunks = [];
  let audioCtx = null, micGain = null, sysGain = null, destNode = null;
  let startTs = 0, elapsedMs = 0, timerInt = null;
  let camVideoEl = null;
  let toastTimer = null;

  const settings = {
    shape: "rounded", blur: "none", camOn: true, micOn: true,
    subtitle: "",
    beauty: { smooth: 0, bright: 0, rosy: 0, sharp: 0 },
    clickFx: true, autoZoom: false, zoomScale: 1,
    zoomFx: 0.5, zoomFy: 0.5, pipX: 90, pipY: 24, pipW: 220, pipH: 124,
  };
  const currentScale = { v: 1 };

  /* ---------------- DOM ---------------- */
  const root = document.createElement("div");
  root.id = "ai-rec-root";
  root.innerHTML = `
    <div class="ai-rec-toolbar" id="aiRecToolbar">
      <span class="ai-rec-brand">🎥 AI Rec</span>
      <span class="ai-rec-dot" id="aiRecDot" style="opacity:0"></span>
      <span class="ai-rec-timer" id="aiRecTimer">00:00</span>
      <button class="ai-rec-btn rec" id="aiRecStart" title="开始录制（将弹出屏幕选择）">● 录制</button>
      <button class="ai-rec-btn pause" id="aiRecPause" style="display:none" title="暂停/继续">⏸</button>
      <button class="ai-rec-btn stop" id="aiRecStop" style="display:none" title="停止并保存">⏹</button>
      <button class="ai-rec-btn toggle" id="aiRecCam" title="摄像头小窗开关">🎥</button>
      <button class="ai-rec-btn toggle" id="aiRecMic" title="麦克风开关">🎙️</button>
      <button class="ai-rec-btn settings" id="aiRecSettings" title="设置：形状/美颜/模糊/字幕/点击特效">⚙️</button>
    </div>
    <div class="ai-rec-pip shape-rounded" id="aiRecPip">
      <video id="aiRecCamVideo" muted playsinline autoplay></video>
      <span class="pip-label">🎥 摄像头小窗</span>
      <button class="pip-del" id="aiRecPipDel" title="关闭摄像头小窗">✕</button>
      <div class="pip-resize" id="aiRecPipResize" title="拖动调整大小">◢</div>
    </div>
    <div class="ai-rec-panel" id="aiRecPanel">
      <h4>🪞 小窗形状（Cap / OpenScreen）</h4>
      <div class="ai-rec-shapes" id="aiRecShapes">
        <button data-shape="rounded" class="ai-rec-shape on">圆角</button>
        <button data-shape="circle" class="ai-rec-shape">圆形</button>
        <button data-shape="ellipse" class="ai-rec-shape">椭圆</button>
        <button data-shape="square" class="ai-rec-shape">方形</button>
        <button data-shape="diamond" class="ai-rec-shape">菱形</button>
      </div>
      <h4 style="margin-top:10px">🌫️ 背景模糊优化</h4>
      <div class="ai-rec-blurs" id="aiRecBlurs">
        <button data-blur="none" class="ai-rec-blur on">无</button>
        <button data-blur="screen" class="ai-rec-blur">页面模糊</button>
        <button data-blur="soft" class="ai-rec-blur">人像柔焦</button>
      </div>
      <h4 style="margin-top:10px">💄 简单美颜</h4>
      <div class="ai-rec-row"><label>磨皮</label><input type="range" min="0" max="1" step="0.01" data-beauty="smooth" value="0"><span>0%</span></div>
      <div class="ai-rec-row"><label>美白</label><input type="range" min="0" max="1" step="0.01" data-beauty="bright" value="0"><span>0%</span></div>
      <div class="ai-rec-row"><label>红润</label><input type="range" min="0" max="1" step="0.01" data-beauty="rosy" value="0"><span>0%</span></div>
      <div class="ai-rec-row"><label>清晰度</label><input type="range" min="0" max="1" step="0.01" data-beauty="sharp" value="0"><span>0%</span></div>
      <h4 style="margin-top:10px">💬 字幕（AI 语音识别 / 手动）</h4>
      <textarea class="ai-rec-subtitle" id="aiRecSubtitle" placeholder="输入字幕，每行一条；或在 Chrome 中自动语音识别"></textarea>
      <label class="ai-rec-check"><input type="checkbox" id="aiRecClickFx" checked> 点击特效（OpenScreen / Recordly）</label>
      <label class="ai-rec-check"><input type="checkbox" id="aiRecAutoZoom"> 点击自动聚焦缩放（Recordly）</label>
    </div>
    <div class="ai-rec-toast" id="aiRecToast"></div>
  `;
  document.documentElement.appendChild(root);

  const $ = (id) => root.querySelector(id);
  const toolbar = $("#aiRecToolbar");
  const startBtn = $("#aiRecStart");
  const pauseBtn = $("#aiRecPause");
  const stopBtn = $("#aiRecStop");
  const camBtn = $("#aiRecCam");
  const micBtn = $("#aiRecMic");
  const dot = $("#aiRecDot");
  const timerEl = $("#aiRecTimer");
  const pip = $("#aiRecPip");
  const pipVideo = $("#aiRecCamVideo");
  const panel = $("#aiRecPanel");
  const toast = $("#aiRecToast");

  /* ---------------- 工具 ---------------- */
  function fmt(ms) {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(m)}:${p(s % 60)}`;
  }
  function toastMsg(html, ms = 5000) {
    toast.innerHTML = html;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), ms);
  }
  function pickMime() {
    const list = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
    for (const m of list) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch {} }
    return "";
  }
  function stopStream(stream) { if (stream) stream.getTracks().forEach((t) => t.stop()); }

  /* ---------------- 设置 ---------------- */
  function applySettingsToDom() {
    pip.className = `ai-rec-pip shape-${settings.shape}${settings.blur === "screen" ? " blur-screen" : ""}`;
    pip.style.left = settings.pipX + "px";
    pip.style.top = settings.pipY + "px";
    pip.style.width = settings.pipW + "px";
    pip.style.height = settings.pipH + "px";
    pip.classList.toggle("hidden", !settings.camOn);
    camBtn.classList.toggle("off", !settings.camOn);
    micBtn.classList.toggle("off", !settings.micOn);
    // 美颜 CSS（预览）
    const b = settings.beauty;
    pipVideo.style.filter = `brightness(${1 + b.bright * 0.45}) contrast(${1 + b.sharp * 0.4}) saturate(${1 + b.rosy * 0.5})`;
    root.querySelectorAll(".ai-rec-shape").forEach((el) => el.classList.toggle("on", el.dataset.shape === settings.shape));
    root.querySelectorAll(".ai-rec-blur").forEach((el) => el.classList.toggle("on", el.dataset.blur === settings.blur));
    root.querySelectorAll("[data-beauty]").forEach((el) => {
      el.value = settings.beauty[el.dataset.beauty];
      el.parentElement.querySelector("span").textContent = Math.round(settings.beauty[el.dataset.beauty] * 100) + "%";
    });
    $("#aiRecSubtitle").value = settings.subtitle;
    $("#aiRecClickFx").checked = settings.clickFx;
    $("#aiRecAutoZoom").checked = settings.autoZoom;
    try { chrome.storage.local.set({ settings }); } catch {}
  }
  function save() {
    settings.pipX = parseFloat(pip.style.left) || settings.pipX;
    settings.pipY = parseFloat(pip.style.top) || settings.pipY;
    settings.pipW = parseFloat(pip.style.width) || settings.pipW;
    settings.pipH = parseFloat(pip.style.height) || settings.pipH;
    try { chrome.storage.local.set({ settings }); } catch {}
  }
  try {
    chrome.storage.local.get("settings", (d) => {
      if (d && d.settings) Object.assign(settings, d.settings);
      applySettingsToDom();
    });
  } catch {}

  /* ---------------- 事件绑定 ---------------- */
  // 工具栏拖动
  let drag = null;
  toolbar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    drag = { dx: e.clientX - toolbar.getBoundingClientRect().left, dy: e.clientY - toolbar.getBoundingClientRect().top };
    toolbar.setPointerCapture(e.pointerId);
    toolbar.classList.add("dragging");
  });
  toolbar.addEventListener("pointermove", (e) => {
    if (!drag) return;
    toolbar.style.left = Math.max(0, Math.min(innerWidth - toolbar.offsetWidth, e.clientX - drag.dx)) + "px";
    toolbar.style.top = Math.max(0, Math.min(innerHeight - toolbar.offsetHeight, e.clientY - drag.dy)) + "px";
    toolbar.style.right = "auto";
  });
  toolbar.addEventListener("pointerup", () => { drag = null; toolbar.classList.remove("dragging"); });

  // 小窗拖动 / 缩放
  let pipDrag = null;
  pip.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".pip-del") || e.target.closest(".pip-resize")) return;
    pipDrag = { sx: e.clientX, sy: e.clientY, ox: pip.getBoundingClientRect().left, oy: pip.getBoundingClientRect().top };
    pip.setPointerCapture(e.pointerId);
  });
  pip.addEventListener("pointermove", (e) => {
    if (!pipDrag) return;
    const nx = Math.max(0, Math.min(innerWidth - pip.offsetWidth, pipDrag.ox + (e.clientX - pipDrag.sx)));
    const ny = Math.max(0, Math.min(innerHeight - pip.offsetHeight, pipDrag.oy + (e.clientY - pipDrag.sy)));
    pip.style.left = nx + "px"; pip.style.top = ny + "px";
    save();
  });
  pip.addEventListener("pointerup", () => { pipDrag = null; });
  const resizeEl = $("#aiRecPipResize");
  let rs = null;
  resizeEl.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    rs = { sx: e.clientX, sy: e.clientY, ow: pip.offsetWidth, oh: pip.offsetHeight };
    resizeEl.setPointerCapture(e.pointerId);
  });
  resizeEl.addEventListener("pointermove", (e) => {
    if (!rs) return;
    const nw = Math.max(90, rs.ow + (e.clientX - rs.sx));
    const nh = Math.max(56, rs.oh + (e.clientY - rs.sy));
    pip.style.width = nw + "px"; pip.style.height = nh + "px";
    save();
  });
  resizeEl.addEventListener("pointerup", () => { rs = null; });

  // 摄像头小窗
  camBtn.addEventListener("click", async () => {
    settings.camOn = !settings.camOn;
    applySettingsToDom();
    if (settings.camOn && !camStream) await openCamera();
    if (!settings.camOn && camStream) { stopStream(camStream); camStream = null; pipVideo.srcObject = null; }
    save();
  });
  $("#aiRecPipDel").addEventListener("click", async () => {
    settings.camOn = false;
    applySettingsToDom();
    if (camStream) { stopStream(camStream); camStream = null; pipVideo.srcObject = null; }
    save();
  });

  // 麦克风
  micBtn.addEventListener("click", async () => {
    settings.micOn = !settings.micOn;
    applySettingsToDom();
    if (settings.micOn && !micStream) await openMic();
    if (!settings.micOn && micStream) { stopStream(micStream); micStream = null; }
    save();
  });

  // 设置面板
  $("#aiRecSettings").addEventListener("click", () => panel.classList.toggle("open"));
  panel.addEventListener("click", (e) => {
    if (e.target.classList.contains("ai-rec-shape")) {
      settings.shape = e.target.dataset.shape;
      applySettingsToDom(); save();
    }
    if (e.target.classList.contains("ai-rec-blur")) {
      settings.blur = e.target.dataset.blur;
      applySettingsToDom(); save();
    }
  });
  root.querySelectorAll("[data-beauty]").forEach((el) => {
    el.addEventListener("input", () => {
      settings.beauty[el.dataset.beauty] = parseFloat(el.value);
      applySettingsToDom(); save();
    });
  });
  $("#aiRecSubtitle").addEventListener("input", (e) => { settings.subtitle = e.target.value; save(); });
  $("#aiRecClickFx").addEventListener("change", (e) => { settings.clickFx = e.target.checked; save(); });
  $("#aiRecAutoZoom").addEventListener("change", (e) => { settings.autoZoom = e.target.checked; save(); });

  // 页面点击 → 点击特效 + 自动聚焦（捕获阶段，不拦截页面操作）
  document.addEventListener("click", (e) => {
    if (!state) return;
    if (e.target === root || root.contains(e.target)) return;
    const r = document.documentElement.getBoundingClientRect();
    const x = e.clientX / r.width, y = e.clientY / r.height;
    if (settings.clickFx && ctx) clickEffects.push({ x, y, t: performance.now() });
    if (settings.autoZoom) { settings.zoomFx = x; settings.zoomFy = y; currentScale.v = Math.max(currentScale.v, 1.6); }
  }, true);

  /* ---------------- 媒体 ---------------- */
  async function openCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      camStream = s;
      pipVideo.srcObject = s;
      pipVideo.play().catch(() => {});
      return true;
    } catch (e) {
      toastMsg(`⚠️ 摄像头打开失败：${e.name || e.message}`, 4000);
      return false;
    }
  }
  async function openMic() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      micStream = s;
      return true;
    } catch (e) {
      toastMsg(`⚠️ 麦克风打开失败：${e.name || e.message}`, 4000);
      return false;
    }
  }

  /* ---------------- 录制 ---------------- */
  async function start() {
    if (state !== IDLE) return;
    let screen = null;
    try {
      screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
    } catch (e) {
      toastMsg(`⚠️ 未选择要录制的屏幕/窗口：${e.name || ""}`, 4000);
      return;
    }
    screenStream = screen;
    screen.getVideoTracks()[0].addEventListener("ended", () => { if (state === REC) stop(true); });

    if (settings.camOn && !camStream) await openCamera();
    if (settings.micOn && !micStream) await openMic();

    // 画布
    const vTrack = screen.getVideoTracks()[0];
    const vSettings = vTrack.getSettings();
    canvas = document.createElement("canvas");
    canvas.width = Math.min(1920, vSettings.width || 1280);
    canvas.height = Math.round(canvas.width * ((vSettings.height || 720) / (vSettings.width || 1280)));
    ctx = canvas.getContext("2d");

    // 音频
    try {
      audioCtx = new AudioContext();
      destNode = audioCtx.createMediaStreamDestination();
      const screenAudio = screen.getAudioTracks()[0];
      if (screenAudio) {
        sysGain = audioCtx.createGain(); sysGain.gain.value = 1;
        audioCtx.createMediaStreamSource(new MediaStream([screenAudio])).connect(sysGain);
        sysGain.connect(destNode);
      }
      if (micStream) {
        micGain = audioCtx.createGain(); micGain.gain.value = 1;
        audioCtx.createMediaStreamSource(micStream).connect(micGain);
        micGain.connect(destNode);
      }
      await audioCtx.resume();
    } catch (e) { console.warn("audio init failed", e); }

    const outStream = canvas.captureStream(30);
    if (destNode) outStream.addTrack(destNode.stream.getAudioTracks()[0]);

    const mime = pickMime();
    try { recorder = new MediaRecorder(outStream, mime ? { mimeType: mime, videoBitsPerSecond: 10_000_000 } : undefined); }
    catch { recorder = new MediaRecorder(outStream); }
    chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => finish();
    recorder.start(200);

    startTs = performance.now() - elapsedMs;
    timerInt = setInterval(() => { elapsedMs = performance.now() - startTs; timerEl.textContent = fmt(elapsedMs); }, 200);

    state = REC;
    dot.style.opacity = 1;
    startBtn.style.display = "none";
    pauseBtn.style.display = "";
    stopBtn.style.display = "";
    draw();
    toastMsg("🔴 正在录制当前网页 — 点击页面任意位置可记录点击特效");
  }

  function togglePause() {
    if (state === REC && recorder && recorder.state === "recording") {
      recorder.pause(); state = PAUSED; dot.style.opacity = 0.4; pauseBtn.textContent = "▶";
      cancelAnimationFrame(raf);
      clearInterval(timerInt);
    } else if (state === PAUSED && recorder && recorder.state === "paused") {
      recorder.resume(); state = REC; dot.style.opacity = 1; pauseBtn.textContent = "⏸";
      startTs = performance.now() - elapsedMs;
      timerInt = setInterval(() => { elapsedMs = performance.now() - startTs; timerEl.textContent = fmt(elapsedMs); }, 200);
      draw();
    }
  }

  function stop(silent) {
    if (state !== REC && state !== PAUSED) return;
    cancelAnimationFrame(raf);
    clearInterval(timerInt);
    if (recorder && (recorder.state === "recording" || recorder.state === "paused")) recorder.stop();
    state = IDLE;
    dot.style.opacity = 0;
    startBtn.style.display = "";
    pauseBtn.style.display = "none"; pauseBtn.textContent = "⏸";
    stopBtn.style.display = "none";
    if (!silent) toastMsg("⏹ 正在保存…");
  }

  function finish() {
    const mime = (recorder && recorder.mimeType) || "video/webm";
    const blob = new Blob(chunks, { type: mime });
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const name = `ai-recorder-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    stopStream(screenStream); screenStream = null;
    stopStream(micStream); micStream = null;
    stopStream(camStream); camStream = null;
    pipVideo.srcObject = null;
    camStream = null; micStream = null;
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    canvas = null; ctx = null;
    elapsedMs = 0; timerEl.textContent = "00:00";
    const size = blob.size > 1048576 ? (blob.size / 1048576).toFixed(1) + " MB" : (blob.size / 1024).toFixed(0) + " KB";
    toastMsg(`✅ 已保存 <b>${name}</b>（${size}）<br><span class="ai-rec-link">📥 打开 AI Video Recorder 继续剪辑 → <a href="http://127.0.0.1:3220" target="_blank">http://127.0.0.1:3220</a></span>`, 9000);
  }

  /* ---------------- 画布绘制 ---------------- */
  const clickEffects = [];
  function draw() {
    if (!ctx || !canvas || !screenStream) return;
    const W = canvas.width, H = canvas.height;
    const v = screenStream.getVideoTracks()[0];
    // 视频元素
    if (!window.__aiRecScreenVideo) {
      const vv = document.createElement("video");
      vv.muted = true; vv.playsInline = true; vv.autoplay = true;
      vv.srcObject = screenStream;
      vv.play().catch(() => {});
      window.__aiRecScreenVideo = vv;
    }
    const vv = window.__aiRecScreenVideo;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);
    if (vv.videoWidth > 0) {
      // 缩放
      const z = Math.max(1, currentScale.v + (settings.zoomScale - 1) * 0.3);
      currentScale.v += (Math.max(1, settings.zoomScale) - currentScale.v) * 0.1;
      const dw = W / z, dh = H / z;
      const dx = (W - dw) * settings.zoomFx, dy = (H - dh) * settings.zoomFy;
      ctx.drawImage(vv, dx, dy, dw, dh);
    }

    // 摄像头小窗
    if (settings.camOn && camStream) {
      const r = pip.getBoundingClientRect();
      const vpW = innerWidth, vpH = innerHeight;
      const px = (r.left / vpW) * W, py = (r.top / vpH) * H, pw = (r.width / vpW) * W, ph = (r.height / vpH) * H;
      drawPip(ctx, camStream, px, py, pw, ph, settings.shape);
    }
    // 字幕
    if (settings.subtitle && settings.subtitle.trim()) {
      const size = Math.max(20, Math.round(H * 0.045));
      ctx.font = `700 ${size}px system-ui, "PingFang SC", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const lines = settings.subtitle.split("\n").filter((l) => l.trim());
      const lineH = size * 1.4;
      const blockH = lines.length * lineH + size * 0.7;
      const y = H - blockH - H * 0.05;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect((W - W * 0.88) / 2, y, W * 0.88, blockH);
      ctx.fillStyle = "#fff";
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y + size * 0.35 + i * lineH + lineH / 2));
    }
    // 点击特效
    const now = performance.now();
    for (let i = clickEffects.length - 1; i >= 0; i--) {
      const c = clickEffects[i];
      if (now - c.t > 650) { clickEffects.splice(i, 1); continue; }
      const p = (now - c.t) / 650;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = "#ffd76a"; ctx.lineWidth = Math.max(2, W / 640);
      ctx.beginPath(); ctx.arc(c.x * W, c.y * H, (12 + p * 52) * (W / 1280), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    raf = requestAnimationFrame(draw);
  }

  function drawPip(ctx, stream, x, y, w, h, shape) {
    const vv = window.__aiRecPipVideo || (window.__aiRecPipVideo = (() => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.autoplay = true;
      v.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;";
      document.body.appendChild(v);
      return v;
    })());
    if (vv.srcObject !== stream) vv.srcObject = stream;
    vv.play().catch(() => {});

    ctx.save();
    clipPip(ctx, x, y, w, h, shape);
    ctx.fillStyle = "rgba(2,6,23,0.9)";
    ctx.fillRect(x, y, w, h);
    if (vv.videoWidth > 0) {
      const s = Math.max(w / vv.videoWidth, h / vv.videoHeight);
      const dw = vv.videoWidth * s, dh = vv.videoHeight * s;
      const b = settings.beauty;
      // 美颜
      ctx.filter = `brightness(${1 + b.bright * 0.45}) contrast(${1 + b.sharp * 0.4}) saturate(${1 + b.rosy * 0.5})`;
      ctx.drawImage(vv, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.filter = "none";
      if (b.smooth > 0.02) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.6, b.smooth * 0.55);
        ctx.filter = `blur(${2 + b.smooth * 9}px)`;
        ctx.drawImage(vv, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        ctx.restore();
      }
      // 人像柔焦：边缘虚化
      if (settings.blur === "soft") {
        const bg = document.createElement("canvas");
        bg.width = Math.max(2, Math.round(dw / 2)); bg.height = Math.max(2, Math.round(dh / 2));
        const bctx = bg.getContext("2d");
        bctx.filter = "blur(13px) brightness(1.04)";
        bctx.drawImage(vv, 0, 0, bg.width, bg.height);
        const mask = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.26, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
        mask.addColorStop(0, "rgba(0,0,0,0)");
        mask.addColorStop(0.55, "rgba(0,0,0,0.25)");
        mask.addColorStop(1, "rgba(0,0,0,0.92)");
        const off = document.createElement("canvas");
        off.width = Math.max(2, Math.round(w)); off.height = Math.max(2, Math.round(h));
        const octx = off.getContext("2d");
        octx.drawImage(bg, 0, 0, off.width, off.height);
        octx.globalCompositeOperation = "destination-in";
        octx.fillStyle = mask;
        octx.fillRect(0, 0, off.width, off.height);
        octx.globalCompositeOperation = "source-over";
        ctx.drawImage(off, x, y, w, h);
      }
    }
    ctx.restore();
    // 边框
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(2, canvas.width / 640);
    strokePip(ctx, x, y, w, h, shape);
    ctx.stroke();
    ctx.restore();
  }

  function clipPip(ctx, x, y, w, h, shape) {
    ctx.beginPath();
    if (shape === "circle") ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    else if (shape === "ellipse") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else if (shape === "diamond") { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y + h / 2); ctx.closePath(); }
    else if (shape === "square") ctx.rect(x, y, w, h);
    else { const r = Math.min(16, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    ctx.clip();
  }
  function strokePip(ctx, x, y, w, h, shape) {
    ctx.beginPath();
    if (shape === "circle") ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    else if (shape === "ellipse") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else if (shape === "diamond") { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y + h / 2); ctx.closePath(); }
    else if (shape === "square") ctx.rect(x, y, w, h);
    else { const r = Math.min(16, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  }

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", togglePause);
  stopBtn.addEventListener("click", () => stop(false));

  applySettingsToDom();
})();
