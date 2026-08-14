import { useEffect, useMemo, useRef, useState } from "react";
import { studio } from "../engine/Studio";
import { TEMPLATES } from "../engine/templates";
import { BGM_TRACKS } from "../engine/bgm";
import { analyzeAudioEnergy, buildEditPlan, renderEditedVideo } from "../engine/aiEdit";
import { downloadBlob, toSrt } from "../engine/export";
import type { EditPlan, SubtitleState } from "../types";
import { useStudioState } from "../hooks";

type Tab = "crop" | "zoom" | "pip" | "subtitle" | "template" | "bgm" | "ai";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "crop", label: "裁剪", emoji: "✂️" },
  { id: "zoom", label: "缩放", emoji: "🔎" },
  { id: "pip", label: "小窗·美颜", emoji: "🪞" },
  { id: "subtitle", label: "字幕", emoji: "💬" },
  { id: "template", label: "模板", emoji: "🎨" },
  { id: "bgm", label: "BGM", emoji: "🎵" },
  { id: "ai", label: "AI 剪辑", emoji: "✨" },
];

export function EnginePanel() {
  const [tab, setTab] = useState<Tab>("subtitle");
  return (
    <div className="engine-panel-inner">
      <h2 className="panel-title">🧰 视频引擎</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <div className="tab-body">
        {tab === "crop" && <CropTab />}
        {tab === "zoom" && <ZoomTab />}
        {tab === "pip" && <PipTab />}
        {tab === "subtitle" && <SubtitleTab />}
        {tab === "template" && <TemplateTab />}
        {tab === "bgm" && <BgmTab />}
        {tab === "ai" && <AiEditTab />}
      </div>
    </div>
  );
}


// ---------- 小窗 / 美颜（OpenScreen/Cap 融合） ----------
const SHAPES: { id: "rounded" | "circle" | "ellipse" | "square" | "diamond"; label: string }[] = [
  { id: "rounded", label: "圆角" },
  { id: "circle", label: "圆形" },
  { id: "ellipse", label: "椭圆" },
  { id: "square", label: "方形" },
  { id: "diamond", label: "菱形" },
];

function PipTab() {
  const [shape, setShape] = useState<"rounded" | "circle" | "ellipse" | "square" | "diamond">("rounded");
  const [beauty, setBeauty] = useState({ smooth: 0, bright: 0, rosy: 0, sharp: 0 });
  const [blur, setBlur] = useState<"none" | "screen" | "soft">("none");
  const [pipSize, setPipSize] = useState(1);
  const [mirror, setMirror] = useState(true);
  const [clickFx, setClickFx] = useState(true);
  const [autoZoom, setAutoZoom] = useState(false);
  const [source1, setSource1] = useState(true);
  const [source2, setSource2] = useState(true);

  useEffect(() => {
    const comp = studio.compositor;
    if (!comp) return;
    comp.pipShape = shape;
    comp.beauty = beauty;
    comp.blurMode = blur;
    comp.enabled.camera1 = source1;
    comp.enabled.camera2 = source2;
  }, [shape, beauty, blur, source1, source2]);

  const applySize = (v: number) => {
    setPipSize(v);
    const comp = studio.compositor;
    if (!comp) return;
    const tpl = comp.template;
    for (const key of ["cam1", "cam2"] as const) {
      const base = tpl.pips[key];
      if (!base) continue;
      comp.pipOverrides[key] = { ...comp.pipOverrides[key], w: base.w * v, h: base.h * v };
    }
  };

  return (
    <div className="tab-section">
      <p className="tab-desc">🪞 摄像头小窗：位置/大小可在画布上直接拖动，形状、美颜与背景模糊实时生效（录制中也生效）。</p>

      <div className="subsection">
        <label className="sub-label">小窗形状（Cap / OpenScreen）</label>
        <div className="preset-row">
          {SHAPES.map((sh) => (
            <button key={sh.id} className={`btn small ${shape === sh.id ? "active" : ""}`} onClick={() => setShape(sh.id)}>{sh.label}</button>
          ))}
        </div>
      </div>

      <div className="slider-row">
        <label>小窗大小</label>
        <input type="range" min="0.5" max="2" step="0.05" value={pipSize} onChange={(e) => applySize(+e.target.value)} />
        <span>{Math.round(pipSize * 100)}%</span>
      </div>

      <div className="subsection">
        <label className="sub-label">💄 简单美颜</label>
        {([
          ["smooth", "磨皮"],
          ["bright", "美白"],
          ["rosy", "红润"],
          ["sharp", "清晰度"],
        ] as const).map(([k, label]) => (
          <div className="slider-row" key={k}>
            <label>{label}</label>
            <input type="range" min="0" max="1" step="0.01" value={beauty[k]}
              onChange={(e) => setBeauty({ ...beauty, [k]: +e.target.value })} />
            <span>{Math.round(beauty[k] * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="subsection">
        <label className="sub-label">🌫️ 背景模糊优化</label>
        <div className="preset-row">
          {([
            ["none", "无"],
            ["screen", "页面模糊"],
            ["soft", "人像柔焦"],
          ] as const).map(([id, label]) => (
            <button key={id} className={`btn small ${blur === id ? "active" : ""}`} onClick={() => setBlur(id)}>{label}</button>
          ))}
        </div>
        <p className="tab-desc">「页面模糊」= 小窗背后的网页内容模糊；「人像柔焦」= 摄像头中心清晰、边缘虚化。</p>
      </div>

      <label className="check-row"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> 摄像头镜像</label>
      <label className="check-row"><input type="checkbox" checked={clickFx} onChange={(e) => setClickFx(e.target.checked)} /> 点击特效（OpenScreen/Recordly）</label>
      <label className="check-row"><input type="checkbox" checked={autoZoom} onChange={(e) => setAutoZoom(e.target.checked)} /> 点击自动聚焦缩放（Recordly）</label>

      <div className="subsection">
        <label className="sub-label">来源可见性（OBS 风格，录制中可切换）</label>
        <label className="check-row"><input type="checkbox" checked={source1} onChange={(e) => setSource1(e.target.checked)} /> Camera 1 可见</label>
        <label className="check-row"><input type="checkbox" checked={source2} onChange={(e) => setSource2(e.target.checked)} /> Camera 2 可见</label>
      </div>

      <div className="pip-tip">💡 录制中也可随时调整形状 / 美颜 / 模糊 / 可见性，全部实时写入视频。</div>
    </div>
  );
}

// ---------- 裁剪 ----------
function CropTab() {
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const apply = (next: typeof crop) => {
    setCrop(next);
    if (studio.compositor) studio.compositor.crop = next;
  };
  const presets = [
    { label: "原图", v: { x: 0, y: 0, w: 1, h: 1 } },
    { label: "16:9", v: { x: 0, y: 0.125, w: 1, h: 0.75 } },
    { label: "9:16", v: { x: 0.28, y: 0, w: 0.44, h: 1 } },
    { label: "1:1", v: { x: 0.19, y: 0, w: 0.62, h: 1 } },
    { label: "4:3", v: { x: 0, y: 0.075, w: 1, h: 0.85 } },
  ];
  return (
    <div className="tab-section">
      <p className="tab-desc">在画布上点击「✂️ 裁剪」可直接拖拽裁剪框；也可用下方数值微调。裁剪作用于屏幕源。</p>
      <div className="preset-row">
        {presets.map((p) => (
          <button key={p.label} className={`btn small ${crop.w === p.v.w && crop.h === p.v.h && crop.x === p.v.x && crop.y === p.v.y ? "active" : ""}`}
            onClick={() => apply(p.v)}>{p.label}</button>
        ))}
      </div>
      {(["x", "y", "w", "h"] as const).map((k) => (
        <div className="slider-row" key={k}>
          <label>{k.toUpperCase()}</label>
          <input type="range" min="0" max="1" step="0.005" value={crop[k]}
            onChange={(e) => apply({ ...crop, [k]: +e.target.value })} />
          <span>{Math.round(crop[k] * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// ---------- 缩放 ----------
function ZoomTab() {
  const [zoom, setZoom] = useState({ scale: 1, focusX: 0.5, focusY: 0.5, smooth: true });
  const apply = (next: typeof zoom) => {
    setZoom(next);
    if (studio.compositor) Object.assign(studio.compositor.zoom, next);
  };
  const focusPresets = [
    { label: "居中", x: 0.5, y: 0.5 },
    { label: "左上", x: 0.15, y: 0.15 },
    { label: "右上", x: 0.85, y: 0.15 },
    { label: "左下", x: 0.15, y: 0.85 },
    { label: "右下", x: 0.85, y: 0.85 },
  ];
  return (
    <div className="tab-section">
      <p className="tab-desc">平滑放大聚焦重点区域。点击画布可直接设定聚焦点。</p>
      <div className="slider-row">
        <label>缩放</label>
        <input type="range" min="1" max="4" step="0.05" value={zoom.scale}
          onChange={(e) => apply({ ...zoom, scale: +e.target.value })} />
        <span>{zoom.scale.toFixed(2)}x</span>
      </div>
      <div className="slider-row">
        <label>聚焦 X</label>
        <input type="range" min="0" max="1" step="0.01" value={zoom.focusX}
          onChange={(e) => apply({ ...zoom, focusX: +e.target.value })} />
      </div>
      <div className="slider-row">
        <label>聚焦 Y</label>
        <input type="range" min="0" max="1" step="0.01" value={zoom.focusY}
          onChange={(e) => apply({ ...zoom, focusY: +e.target.value })} />
      </div>
      <div className="preset-row">
        {focusPresets.map((p) => (
          <button key={p.label} className="btn small" onClick={() => apply({ ...zoom, focusX: p.x, focusY: p.y })}>{p.label}</button>
        ))}
      </div>
      <label className="check-row">
        <input type="checkbox" checked={zoom.smooth} onChange={(e) => apply({ ...zoom, smooth: e.target.checked })} />
        平滑缩放动画
      </label>
    </div>
  );
}

// ---------- 字幕 ----------
function SubtitleTab() {
  const state = useStudioState();
  const [sub, setSub] = useState<SubtitleState>({
    enabled: true, lines: ["欢迎来到 AI Video Recorder", "多源合成 · 一键发布"],
    fontSize: 46, color: "#ffffff", bg: "rgba(0,0,0,0.72)", position: "bottom",
    liveCaptions: false, liveText: "", timedEntries: [],
  });
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const startTsRef = useRef(0);
  const lastFinal = useRef("");

  const apply = (next: SubtitleState) => {
    setSub(next);
    if (studio.compositor) studio.compositor.subtitle = next;
  };

  useEffect(() => {
    if (studio.compositor) studio.compositor.subtitle = sub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLive = (on: boolean) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (on && SR) {
      const rec = new SR();
      rec.lang = "zh-CN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            const text = r[0]?.transcript ?? "";
            const entry = { start: lastFinal.current ? startTsRef.current : startTsRef.current, end: startTsRef.current + 2, text };
            lastFinal.current = text;
            startTsRef.current = performance.now() / 1000;
            const next = { ...sub, liveText: "", timedEntries: [...sub.timedEntries, entry].slice(-200) };
            setSub(next);
            if (studio.compositor) studio.compositor.subtitle = next;
          } else {
            interim += r[0]?.transcript ?? "";
          }
        }
        const next = { ...sub, liveText: interim };
        setSub(next);
        if (studio.compositor) studio.compositor.subtitle = next;
      };
      rec.onend = () => { if (on) try { rec.start(); } catch { /* noop */ } };
      rec.onerror = () => {};
      try { rec.start(); } catch { /* noop */ }
      recRef.current = rec;
      startTsRef.current = 0;
      lastFinal.current = "";
      apply({ ...sub, liveCaptions: true });
    } else {
      recRef.current?.stop();
      recRef.current = null;
      apply({ ...sub, liveCaptions: false });
    }
  };

  const exportSrt = () => {
    const entries = sub.timedEntries.length > 0 ? sub.timedEntries : sub.lines.map((l, i) => ({ start: i * 3, end: i * 3 + 2.8, text: l }));
    const srt = toSrt(entries);
    downloadBlob(new Blob([srt], { type: "text/plain" }), "captions.srt");
  };

  return (
    <div className="tab-section">
      <label className="check-row">
        <input type="checkbox" checked={sub.enabled} onChange={(e) => apply({ ...sub, enabled: e.target.checked })} />
        显示字幕
      </label>
      <textarea
        className="subtitle-input"
        rows={4}
        value={sub.lines.join("\n")}
        placeholder={"每行一条字幕…"}
        onChange={(e) => apply({ ...sub, lines: e.target.value.split("\n") })}
      />
      <div className="slider-row">
        <label>字号</label>
        <input type="range" min="24" max="90" step="1" value={sub.fontSize}
          onChange={(e) => apply({ ...sub, fontSize: +e.target.value })} />
        <span>{sub.fontSize}</span>
      </div>
      <div className="color-row">
        <label>文字色</label><input type="color" value={sub.color} onChange={(e) => apply({ ...sub, color: e.target.value })} />
        <label>底色</label><input type="color" value={sub.bg === "rgba(0,0,0,0.72)" ? "#000000" : sub.bg} onChange={(e) => apply({ ...sub, bg: hexToRgba(e.target.value, 0.72) })} />
        <label>位置</label>
        <select value={sub.position} onChange={(e) => apply({ ...sub, position: e.target.value as "bottom" | "top" })}>
          <option value="bottom">底部</option><option value="top">顶部</option>
        </select>
      </div>

      <div className="ai-caption-box">
        <div className="row-between">
          <strong>🎙️ AI 语音识别字幕</strong>
          <button className={`btn small ${sub.liveCaptions ? "danger" : ""}`}
            onClick={() => toggleLive(!sub.liveCaptions)} disabled={state === "recording" && !sub.liveCaptions}>
            {sub.liveCaptions ? "关闭" : "开启"}
          </button>
        </div>
        {!window.SpeechRecognition && !window.webkitSpeechRecognition && (
          <p className="warn">当前浏览器不支持语音识别（建议使用 Chrome / Edge）。</p>
        )}
        {sub.liveText && <p className="live-caption">🎤 {sub.liveText}</p>}
        <button className="btn small ghost" onClick={exportSrt}>⬇️ 导出 SRT 字幕</button>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// ---------- 模板 ----------
function TemplateTab() {
  const [selected, setSelected] = useState(studio.templateId);
  return (
    <div className="tab-section">
      <p className="tab-desc">选择输出画布与布局模板，适配各平台比例。模板切换会重建合成画布。</p>
      <div className="template-grid">
        {TEMPLATES.map((t) => (
          <button key={t.id} className={`template-card ${selected === t.id ? "active" : ""}`}
            onClick={() => { setSelected(t.id); studio.setTemplate(t.id); }}>
            <div className="template-emoji">{t.emoji}</div>
            <strong>{t.name}</strong>
            <small>{t.width}×{t.height}</small>
            <span className="template-platforms">{t.platforms.join(" / ")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- BGM ----------
function BgmTab() {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [vol, setVol] = useState(0.5);
  const [duck, setDuck] = useState(true);
  useEffect(() => {
    studio.setDucking(duck);
  }, [duck]);
  return (
    <div className="tab-section">
      <p className="tab-desc">内置 AI 合成背景音乐（WebAudio 实时生成，无需素材文件）。开启后自动与麦克风/系统声音混音。</p>
      <div className="bgm-list">
        {BGM_TRACKS.map((t) => (
          <button key={t.id} className={`bgm-item ${trackId === t.id ? "active" : ""}`}
            onClick={() => {
              const next = trackId === t.id ? null : t.id;
              setTrackId(next);
              studio.setBgm(next, vol);
            }}>
            <span className="bgm-emoji">{t.emoji}</span>
            <span className="bgm-name">{t.name}</span>
            <span className="bgm-meta">{t.bpm} BPM · {t.style}</span>
            <span className="bgm-play">{trackId === t.id ? "⏹" : "▶"}</span>
          </button>
        ))}
      </div>
      <div className="slider-row">
        <label>音量</label>
        <input type="range" min="0" max="1" step="0.01" value={vol}
          onChange={(e) => { const v = +e.target.value; setVol(v); studio.setBgmVolume(v); }} />
        <span>{Math.round(vol * 100)}%</span>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={duck} onChange={(e) => setDuck(e.target.checked)} />
        说话时自动压低 BGM（闪避）
      </label>
    </div>
  );
}

// ---------- AI 剪辑 ----------
function AiEditTab() {
  const state = useStudioState();
  const recorded = studio.recordedBlob && studio.recordedUrl;
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [subtitleOn, setSubtitleOn] = useState(true);
  const [bgmOn, setBgmOn] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const analyze = async () => {
    if (!studio.recordedBlob) return;
    setAnalyzing(true);
    setLog((l) => [...l, "🔍 正在分析音轨能量…"]);
    try {
      const energy = await analyzeAudioEnergy(studio.recordedBlob);
      const duration = studio.recordedDuration / 1000 || energy.length * 0.25;
      const p = buildEditPlan(energy, duration);
      setPlan(p);
      setLog((l) => [...l, `✅ 分析完成：共 ${p.segments.filter((s) => s.keep).length} 个保留片段，剪除静音 ${p.silenceCuts} 段。`]);
    } catch (e) {
      setLog((l) => [...l, `⚠️ 分析失败：${(e as Error).message}`]);
    } finally {
      setAnalyzing(false);
    }
  };

  const render = async () => {
    if (!studio.recordedBlob || !studio.recordedUrl || !plan) return;
    setRendering(true);
    setProgress(0);
    const subtitleText = subtitleOn ? studio.compositor?.subtitle.lines.join("\n") || undefined : undefined;
    const bgmId = bgmOn ? (studio.audio ? null : null) : null;
    // 使用当前 BGM 选择（若有）
    const activeBgm = bgmOn ? BGM_TRACKS.find((t) => t.id === studio.audio?.currentBgmId)?.id ?? BGM_TRACKS[0].id : null;
    try {
      const blob = await renderEditedVideo({
        videoUrl: studio.recordedUrl,
        plan,
        template: studio.getTemplate(),
        subtitleText,
        bgmId: bgmOn ? activeBgm : null,
        onProgress: (p, label) => { setProgress(p); setLog((l) => [...l.slice(-8), `⏳ ${label} ${p}%`]); },
      });
      const url = URL.createObjectURL(blob);
      downloadBlob(blob, `ai-edited-${Date.now()}.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      setLog((l) => [...l.slice(-8), `🎉 AI 剪辑完成！已下载：${blob.size > 1024 * 1024 ? (blob.size / 1024 / 1024).toFixed(1) + " MB" : (blob.size / 1024).toFixed(0) + " KB"}`]);
      // 替换为剪辑结果，方便继续导出/分享
      studio.recordedBlob = blob;
      if (studio.recordedUrl) URL.revokeObjectURL(studio.recordedUrl);
      studio.recordedUrl = url;
      studio.recordedDuration = plan.totalKeep * 1000;
    } catch (e) {
      setLog((l) => [...l, `⚠️ 渲染失败：${(e as Error).message}`]);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="tab-section">
      <p className="tab-desc">✨ AI 智能剪辑：分析录像能量，自动剪除静音、标记高光、生成最终视频（可叠加字幕与 BGM）。全部在本地完成。</p>
      {!recorded ? (
        <p className="warn">先录制一段视频，才能进行 AI 剪辑。</p>
      ) : (
        <>
          <button className="btn primary" onClick={analyze} disabled={analyzing || rendering}>
            {analyzing ? "⏳ 分析中…" : plan ? "↺ 重新分析" : "🔍 分析并生成剪辑方案"}
          </button>

          {plan && (
            <div className="plan-box">
              <div className="plan-stats">
                <span>🎬 保留 <b>{plan.totalKeep.toFixed(1)}s</b></span>
                <span>✂️ 剪除 <b>{plan.totalTrim.toFixed(1)}s</b></span>
                <span>💡 高光 <b>{plan.highlights}</b></span>
                <span>🔇 静音段 <b>{plan.silenceCuts}</b></span>
              </div>
              <div className="plan-segments">
                {plan.segments.map((s, i) => (
                  <div key={i} className={`seg ${s.keep ? "keep" : "cut"} ${s.reason === "highlight" ? "hot" : ""}`}
                    title={`${s.start.toFixed(1)}s → ${s.end.toFixed(1)}s · ${s.reason}`}
                    style={{ width: `${Math.max(2, ((s.end - s.start) / (plan.totalKeep + plan.totalTrim)) * 100)}%` }} />
                ))}
              </div>
              <div className="check-row"><input type="checkbox" checked={subtitleOn} onChange={(e) => setSubtitleOn(e.target.checked)} /> 叠加字幕</div>
              <div className="check-row"><input type="checkbox" checked={bgmOn} onChange={(e) => setBgmOn(e.target.checked)} /> 叠加 BGM</div>
              <button className="btn primary" onClick={render} disabled={rendering}>
                {rendering ? `⏳ 渲染中 ${progress}%` : "🎞️ 渲染 AI 剪辑视频"}
              </button>
            </div>
          )}
        </>
      )}
      {log.length > 0 && <div className="ai-log">{log.slice(-10).map((l, i) => <p key={i}>{l}</p>)}</div>}
    </div>
  );
}
