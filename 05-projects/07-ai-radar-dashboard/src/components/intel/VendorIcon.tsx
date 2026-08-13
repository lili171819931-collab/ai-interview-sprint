/** Map model vendor names to local brand icons (AIHOT-compatible set). */
const VENDOR_ICON: Record<string, string> = {
  Anthropic: "/model-providers/anthropic.svg",
  OpenAI: "/model-providers/openai.svg",
  "Moonshot AI": "/model-providers/moonshot.svg",
  xAI: "/model-providers/xai.svg",
  Alibaba: "/model-providers/qianwen.svg",
  DeepSeek: "/model-providers/deepseek.svg",
  Meta: "/model-providers/meta.svg",
  "Z.ai": "/model-providers/z-ai.svg",
  Google: "/model-providers/google.svg",
  Tencent: "/model-providers/tencent.svg",
};

const VENDOR_TINT: Record<string, string> = {
  Anthropic: "#2a1f1a",
  OpenAI: "#1a1f1c",
  "Moonshot AI": "#132033",
  xAI: "#1a1a1a",
  Alibaba: "#13233a",
  DeepSeek: "#141c33",
  Meta: "#0f1f33",
  "Z.ai": "#1a1f1c",
  Google: "#152033",
  Tencent: "#102530",
};

export function vendorIconSrc(vendor: string): string | null {
  return VENDOR_ICON[vendor] || null;
}

export function VendorIcon({ vendor, size = 22 }: { vendor: string; size?: number }) {
  const src = vendorIconSrc(vendor);
  const tint = VENDOR_TINT[vendor] || "var(--ink)";

  if (!src) {
    return (
      <span className="lb-avatar lb-avatar-fallback" style={{ width: size, height: size }} aria-hidden>
        {vendor.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className="lb-avatar" style={{ width: size, height: size, background: tint }} aria-hidden>
      <img src={src} alt="" width={size - 6} height={size - 6} />
    </span>
  );
}
