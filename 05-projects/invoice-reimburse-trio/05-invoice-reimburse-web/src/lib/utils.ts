import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function statusLabel(status: string) {
  switch (status) {
    case "compliant":
      return "可报";
    case "conditional":
      return "限报/待确认";
    case "non_compliant":
      return "拒报";
    case "draft":
      return "草稿";
    case "submitted":
      return "已提交";
    case "approved":
      return "已通过";
    case "rejected":
      return "已驳回";
    default:
      return status;
  }
}

export function statusTone(status: string) {
  if (status === "compliant" || status === "approved") return "ok";
  if (status === "conditional" || status === "submitted" || status === "draft") return "warn";
  if (status === "non_compliant" || status === "rejected") return "danger";
  return "info";
}
