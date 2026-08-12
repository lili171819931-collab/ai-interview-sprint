export type HistoryDaySummary = {
  radarReportDate?: string;
  pulseReportDate?: string;
  hotGeneratedAt?: string;
  bundleGeneratedAt?: string;
  sourcesOk?: number;
  sourcesTotal?: number;
  radarSignals?: number;
};

export type HistoryDayEntry = {
  date: string;
  archivedAt: string;
  files: string[];
  summary: HistoryDaySummary;
};

export type HistoryIndex = {
  updatedAt: string;
  timezone: "Asia/Shanghai";
  days: HistoryDayEntry[];
};
