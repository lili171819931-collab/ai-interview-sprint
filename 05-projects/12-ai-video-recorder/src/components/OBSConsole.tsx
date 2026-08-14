import { useEffect, useRef, useState } from "react";
import { studio } from "../engine/Studio";
import { useForceUpdate, useStudioState } from "../hooks";

// ============ OBS 风格底部控制台：场景 / 来源 / 混音器 ============

export function OBSConsole() {
  const state = useStudioState();
  const force = useForceUpdate();
  const [vol, setVol] = useState({ mic: 1, sys: 1, bgm: 0.5, master: 1 });
  const [muted, setMuted] = useState({ mic: false, sys: false, bgm: false });
  const lastBgm = useRef<string | null>("lofi-chill");
  const imgInput = useRef<HTMLInputElement>(null);
  const micMeter = useRef<HTMLDivElement>(null);
  const sysMeter = useRef<HTMLDivElement>(null);
  const bgmMeter = useRef<HTMLDivElement>(null);
  const masterMeter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const offs = [
      studio.on("scenes", force),
      studio.on("sources", force),
      studio.on("state", force),
    ];
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 电平表
  useEffect(() => {
    const id = window.setInterval(() => {
      const lv = studio.getMixerLevels();
      const set = (ref: React.RefObject<HTMLDivElement | null>, v: number) => {
        if (ref.current) ref.current.style.width = `${Math.round(v * 100)}%`;
      };
      set(micMeter, lv.mic);
      set(sysMeter, lv.sys);
      set(bgmMeter, lv.bgm);
      set(masterMeter, lv.master);
    }, 150);
    return () => clearInterval(id);
  }, []);

  const scenes = studio.getScenes();
  const currentId = studio.getCurrentSceneId();
  const comp = studio.compositor;
  const curScene = scenes.find((s) => s.id === currentId);

  // ---------- 混音器 ----------
  const setMixer = (key: keyof typeof vol, v: number) => {
    setVol((prev) => ({ ...prev, [key]: v }));
    if (key === "mic") studio.setMicVolume(v);
    else if (key === "sys") studio.setSystemVolume(v);
    else if (key === "bgm") studio.setBgmVolume(v);
    else studio.setMasterVolume(v);
  };
  const toggleMute = (key: keyof typeof muted) => {
    const next = !muted[key];
    setMuted((prev) => ({ ...prev, [key]: next }));
    if (key === "mic") studio.setMicVolume(next ? 0 : vol.mic);
    else if (key === "sys") studio.setSystemVolume(next ? 0 : vol.sys);
    else studio.setBgmVolume(next ? 0 : vol.bgm);
  };

  // ---------- 来源 ----------
  const toggleVideo = (key: "screen" | "camera1" | "camera2") => {
    if (!comp) return;
    if (key === "screen") comp.enabled.screen = !comp.enabled.screen;
    if (key === "camera1") comp.enabled.camera1 = !comp.enabled.camera1;
    if (key === "camera2") comp.enabled.camera2 = !comp.enabled.camera2;
    force();
  };
  const toggleSubtitle = () => {
    if (!comp) return;
    comp.subtitle.enabled = !comp.subtitle.enabled;
    force();
  };
  const toggleBgm = () => {
    const id = studio.audio?.currentBgmId;
    if (id) { lastBgm.current = id; studio.setBgm(null); }
    else studio.setBgm(lastBgm.current);
    force();
  };
  const addText = () => {
    const t = window.prompt("输入文字内容：", "🎉 直播进行中");
    if (t) studio.addTextSource(t);
  };
  const editText = (id: string, cur: string) => {
    const t = window.prompt("修改文字内容：", cur);
    if (t) studio.updateTextSource(id, { text: t });
  };
  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") studio.addImageSource(reader.result); };
    reader.readAsDataURL(f);
  };

  const bgmOn = !!studio.audio?.currentBgmId;
  const srcDefs: { key?: "screen" | "camera1" | "camera2"; label: string; emoji: string; on?: boolean; onToggle?: () => void }[] = [
    { key: "screen", label: "屏幕", emoji: "🖥️", on: comp?.enabled.screen, onToggle: () => toggleVideo("screen") },
    { key: "camera1", label: "Camera 1", emoji: "🎥", on: comp?.enabled.camera1, onToggle: () => toggleVideo("camera1") },
    { key: "camera2", label: "Camera 2", emoji: "📷", on: comp?.enabled.camera2, onToggle: () => toggleVideo("camera2") },
    { label: "字幕", emoji: "💬", on: comp?.subtitle.enabled, onToggle: toggleSubtitle },
    { label: "BGM", emoji: "🎵", on: bgmOn, onToggle: toggleBgm },
  ];

  return (
    <div className="obs-console">
      {/* 场景 */}
      <div className="obs-section">
        <div className="obs-head">
          <strong>🎬 场景</strong>
          <div className="obs-actions">
            <select className="obs-select" value={studio.transitionKind} onChange={(e) => studio.setTransitionKind(e.target.value as never)} title="场景转场">
              <option value="cut">切换·无转场</option>
              <option value="fade">淡入淡出</option>
              <option value="wipe">擦除</option>
            </select>
            <button className="btn small" onClick={() => studio.newScene()} title="新建场景">➕ 新建</button>
            <button className="btn small ghost" onClick={() => currentId && studio.duplicateScene(currentId)} title="复制当前场景">⧉</button>
            <button className="btn small ghost" onClick={() => currentId && studio.renameScene(currentId, window.prompt("新场景名称", curScene?.name) ?? curScene?.name ?? "")} title="重命名">✏️</button>
            <button className="btn small danger" onClick={() => { if (window.confirm("删除当前场景？")) studio.deleteScene(currentId); }} title="删除当前场景">🗑</button>
          </div>
        </div>
        <div className="scene-list">
          {scenes.map((sc) => (
            <button key={sc.id} className={`scene-chip ${sc.id === currentId ? "active" : ""}`}
              onClick={() => studio.switchScene(sc.id)} title={sc.id === currentId ? "当前场景" : "切换场景"}>
              {sc.name}
            </button>
          ))}
        </div>
        <div className="obs-tip">💡 录制中切换场景同样生效（带转场）</div>
      </div>

      {/* 来源 */}
      <div className="obs-section">
        <div className="obs-head">
          <strong>📦 来源</strong>
          <div className="obs-actions">
            <button className="btn small" onClick={addText}>➕ 文字</button>
            <button className="btn small" onClick={() => imgInput.current?.click()}>🖼 图片</button>
            <input ref={imgInput} type="file" accept="image/*" hidden onChange={addImage} />
          </div>
        </div>
        <div className="src-list">
          {srcDefs.map((s) => (
            <div key={s.label} className="src-item">
              <span className="src-emoji">{s.emoji}</span>
              <span className="src-name">{s.label}</span>
              <button className={`eye-btn ${s.on === false ? "off" : ""}`} onClick={s.onToggle} title="可见性（OBS 眼睛图标）">
                {s.on === false ? "🚫" : "👁"}
              </button>
            </div>
          ))}
          {comp?.textSources.map((t) => (
            <div key={t.id} className="src-item">
              <span className="src-emoji">🔤</span>
              <span className="src-name src-text">{t.text.slice(0, 14) || "文字来源"}</span>
              <button className="eye-btn" onClick={() => editText(t.id, t.text)} title="编辑文字">✏️</button>
              <button className="eye-btn danger" onClick={() => studio.removeTextSource(t.id)} title="删除">🗑</button>
            </div>
          ))}
          {comp?.imageSources.map((im) => (
            <div key={im.id} className="src-item">
              <span className="src-emoji">🖼️</span>
              <span className="src-name">图片来源</span>
              <button className="eye-btn danger" onClick={() => studio.removeImageSource(im.id)} title="删除">🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* 混音器 */}
      <div className="obs-section">
        <div className="obs-head"><strong>🔊 混音器</strong></div>
        <div className="mixer">
          {([
            ["mic", "麦克风", micMeter, muted.mic],
            ["sys", "系统声", sysMeter, muted.sys],
            ["bgm", "BGM", bgmMeter, muted.bgm],
          ] as const).map(([key, label, meterRef, isMuted]) => (
            <div key={key} className="mixer-channel">
              <div className="mixer-top">
                <button className={`eye-btn ${isMuted ? "off" : ""}`} onClick={() => toggleMute(key)} title="静音">
                  {isMuted ? "🔇" : "🔊"}
                </button>
                <span className="mixer-label">{label}</span>
                <span className="mixer-db">{Math.round((isMuted ? 0 : vol[key]) * 100)}%</span>
              </div>
              <div className="meter"><div className="meter-fill" ref={meterRef} style={{ width: "0%" }} /></div>
              <input type="range" min="0" max="1.5" step="0.01" value={isMuted ? 0 : vol[key]}
                onChange={(e) => setMixer(key, +e.target.value)} />
            </div>
          ))}
          <div className="mixer-channel">
            <div className="mixer-top">
              <span className="mixer-label master">主输出</span>
              <span className="mixer-db">{Math.round(vol.master * 100)}%</span>
            </div>
            <div className="meter master"><div className="meter-fill" ref={masterMeter} style={{ width: "0%" }} /></div>
            <input type="range" min="0" max="1.5" step="0.01" value={vol.master} onChange={(e) => setMixer("master", +e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
