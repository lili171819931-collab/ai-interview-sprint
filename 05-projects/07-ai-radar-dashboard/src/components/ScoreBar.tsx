export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (score / 5) * 100));
  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>{label}</span>
          <span>{score}/5</span>
        </div>
      ) : null}
      <div className="score-track">
        <div className="score-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
