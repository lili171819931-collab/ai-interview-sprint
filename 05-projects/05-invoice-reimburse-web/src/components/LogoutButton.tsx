"use client";

export function LogoutButton() {
  return (
    <button
      className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
      onClick={async () => {
        await fetch("/api/auth/login", { method: "DELETE" });
        window.location.href = "/login";
      }}
    >
      退出
    </button>
  );
}
