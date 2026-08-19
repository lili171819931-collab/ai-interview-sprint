"use client";

import { Tx } from "@/components/i18n/Tx";

export function SiteFooter() {
  return (
    <footer className="page-main pt-12 pb-8 text-xs text-[var(--muted)]">
      <Tx k="footer.line" />{" "}
      <a href="https://aihot.virxact.com/terms" className="hover:text-[var(--text)]">
        <Tx k="footer.terms" />
      </a>
    </footer>
  );
}
