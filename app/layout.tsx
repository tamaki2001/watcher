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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body style={{ margin: 0, background: "#0a0a0a", color: "#e0e0e0" }}>
        {children}
      </body>
    </html>
  );
}
