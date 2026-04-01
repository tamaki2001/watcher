import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Watcher — 禁煙監視ダッシュボード",
  description: "タバコ税の軍事転用に抗議する禁煙監視システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#e0e0e0" }}>
        {children}
      </body>
    </html>
  );
}
