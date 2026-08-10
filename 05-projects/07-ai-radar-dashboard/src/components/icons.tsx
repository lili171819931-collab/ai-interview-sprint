import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Code2,
  Workflow,
  Shapes,
  FileText,
  Layers,
  Globe,
  Lock,
  Plug,
  Filter,
  GitCompare,
  ExternalLink,
  Download,
  ShieldCheck,
  ShieldAlert,
  ShieldHalf,
  ShieldQuestion,
  Activity,
  Clock,
  Archive,
  Radar,
  Network,
  Share2,
  Search,
  Building2,
  User,
  Cpu,
} from "lucide-react";
import type { Category, Integration, SourceLevel } from "@/lib/types";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  assistant: Bot,
  platform: Code2,
  agent: Workflow,
  vertical: Shapes,
};

export const CAPABILITY_ICONS: Record<string, LucideIcon> = {
  文本: FileText,
  多模态: Layers,
  API: Globe,
  IDE: Cpu,
  私有化: Lock,
  插件: Plug,
};

export const SOURCE_LEVEL_ICONS: Record<SourceLevel, LucideIcon> = {
  official: ShieldCheck,
  first_hand: ShieldHalf,
  secondary: ShieldAlert,
  inferred: ShieldQuestion,
};

export const STATUS_ICONS = {
  fresh: Activity,
  stale: Clock,
  deprecated: Archive,
} as const;

export const ACTION_ICONS = {
  filter: Filter,
  compare: GitCompare,
  external: ExternalLink,
  download: Download,
  search: Search,
} as const;

export const AUDIENCE_ICONS = {
  consumer: User,
  developer: Code2,
  enterprise: Building2,
} as const;

export const NAV_ICONS = {
  radar: Radar,
  network: Network,
  share: Share2,
} as const;

export function iconForIntegration(int: Integration): LucideIcon {
  switch (int) {
    case "web":
      return Globe;
    case "api":
      return Globe;
    case "ide":
      return Cpu;
    case "plugin":
      return Plug;
    case "private":
      return Lock;
    default:
      return Globe;
  }
}
