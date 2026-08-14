import { useEffect, useMemo, useState } from "react";
import { studio } from "../engine/Studio";
import { PLATFORMS, copyVideoToClipboard, downloadBlob, formatDuration, openPlatform, toSrt, toVtt } from "../engine/export";

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const [filename, setFilename] = useState(() => `ai-video-${new Date().toISOString().slice(0, 10)}`);
  const [copied, setCopied] = useState<string | null>(null);
  const [clipOk, setClipOk] = useState<boolean | null>(null);

  const blob = studio.recordedBlob;
  const url = studio.recordedUrl;
  const duration = studio.recordedDuration;
  const tpl = studio.getTemplate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ext = useMemo(() => (blob?.type.includes("mp4") ? "mp4" : "webm"), [blob?.type]);

  if (!blob || !url) return null;

  const sizeMb = (blob.size / 1024 / 1024).toFixed(2);

  const handleDownload = () => {
    downloadBlob(blob, `${filename}.${ext}`);
  };

  const handleCopy = async () => {
    const ok = await copyVideoToClipboard(blob);
    setClipOk(ok);
    setCopied("clip");
    setTimeout(() => setCopied(null), 3000);
  };

  const handlePlatform = async (id: string) => {
    setCopied(id);
    // 尝试复制视频，用户可直接粘贴到上传页
    const ok = await copyVideoToClipboard(blob).catch(() => false);
    setClipOk(ok);
    openPlatform(id);
    setTimeout(() => setCopied(null), 5000);
  };

  const handleSrt = () => {
    const entries = studio.compositor?.subtitle.timedEntries;
    const lines = studio.compositor?.subtitle.lines ?? [];
    const caps = entries && entries.length > 0
      ? entries
      : lines.map((l, i) => ({ start: i * 3, end: i * 3 + 2.8, text: l }));
    downloadBlob(new Blob([toSrt(caps)], { type: "text/plain" }), `${filename}.srt`);
    downloadBlob(new Blob([toVtt(caps)], { type: "text/vtt" }), `${filename}.vtt`);
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>🚀 导出 & 发布</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-body">
          <div className="export-preview">
            <video src={url} controls muted playsInline />
            <div className="export-meta">
              <span>⏱ {formatDuration(duration)}</span>
              <span>📦 {sizeMb} MB</span>
              <span>🎨 {tpl.width}×{tpl.height}@{tpl.fps}fps</span>
              <span>🧬 {blob.type || "video"}</span>
            </div>
          </div>

          <div className="export-actions">
            <label className="field">
              文件名
              <input value={filename} onChange={(e) => setFilename(e.target.value)} />
            </label>
            <div className="btn-row">
              <button className="btn primary" onClick={handleDownload}>⬇️ 下载视频（{ext.toUpperCase()}）</button>
              <button className="btn" onClick={handleCopy}>
                {copied === "clip" ? (clipOk ? "✅ 已复制" : "⚠️ 复制失败") : "📋 复制到剪贴板"}
              </button>
              <button className="btn" onClick={handleSrt}>💬 字幕 SRT/VTT</button>
            </div>
            <p className="hint">
              {clipOk === false && "当前浏览器不支持复制视频到剪贴板，可下载后手动上传。"}
              {clipOk !== false && "复制后可直接粘贴到平台的视频上传框（需 Chrome/Edge）。"}
            </p>
          </div>

          <div className="share-row">
            <h3>一键发布到平台</h3>
            <div className="platform-grid">
              {PLATFORMS.map((p) => (
                <button key={p.id} className="platform-btn" onClick={() => handlePlatform(p.id)}>
                  <span className="platform-emoji">{p.emoji}</span>
                  <strong>{p.name}</strong>
                  <small>{copied === p.id ? (clipOk ? "已复制，去粘贴 →" : "打开上传页 →") : "打开上传页"}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
