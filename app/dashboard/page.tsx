"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  type: string;
  date: string;
  quantity?: number;
  cost?: number;
  lockUntil?: string;
}

interface Redemption {
  date: string;
  url: string;
  reason: string;
}

interface Status {
  isLocked: boolean;
  lockExpiresAt: string | null;
  streak: { days: number; startDate: string };
  stats: {
    blockedCount: number;
    blockedBudget: number;
    complicityCount: number;
    complicityBudget: number;
  };
  history: HistoryEntry[];
  redemptions: Redemption[];
}

const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || "tamaki2001/watcher";
const STATUS_URL = `https://raw.githubusercontent.com/${REPO}/main/data/status.json`;

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(STATUS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setStatus)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>⚠️ データ取得エラー</h1>
        <p>{error}</p>
        <p style={{ opacity: 0.6 }}>
          NEXT_PUBLIC_GITHUB_REPO 環境変数を設定してください
        </p>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={styles.container}>
        <p style={{ textAlign: "center", opacity: 0.5 }}>監視データ読込中...</p>
      </div>
    );
  }

  const netBudget = status.stats.blockedBudget - status.stats.complicityBudget;

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <h1 style={styles.title}>THE WATCHER</h1>
        <p style={styles.subtitle}>禁煙監視システム — Claude Edition</p>
      </header>

      {/* ステータスバナー */}
      <div
        style={{
          ...styles.banner,
          background: status.isLocked
            ? "linear-gradient(135deg, #8b0000, #4a0000)"
            : "linear-gradient(135deg, #004d00, #001a00)",
          border: `1px solid ${status.isLocked ? "#ff4444" : "#44ff44"}`,
        }}
      >
        <span style={{ fontSize: "2rem" }}>
          {status.isLocked ? "🔒" : "✅"}
        </span>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {status.isLocked ? "LOCKED — CLI無効化中" : `禁煙 ${status.streak.days} 日目`}
          </div>
          {status.isLocked && status.lockExpiresAt && (
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              解除期限: {new Date(status.lockExpiresAt).toLocaleString("ja-JP")}
            </div>
          )}
          {!status.isLocked && (
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              開始日: {status.streak.startDate}
            </div>
          )}
        </div>
      </div>

      {/* 統計カード */}
      <div style={styles.grid}>
        <StatCard
          label="阻止した軍事予算"
          value={`¥${status.stats.blockedBudget.toLocaleString()}`}
          sub={`${status.stats.blockedCount} 回の誘惑を阻止`}
          color="#44ff44"
        />
        <StatCard
          label="加担してしまった額"
          value={`¥${status.stats.complicityBudget.toLocaleString()}`}
          sub={`${status.stats.complicityCount} 回の購入`}
          color="#ff4444"
        />
        <StatCard
          label="差引スコア"
          value={`${netBudget >= 0 ? "+" : ""}¥${netBudget.toLocaleString()}`}
          sub={netBudget >= 0 ? "平和側に貢献中" : "まだ軍事側に加担中"}
          color={netBudget >= 0 ? "#44ff44" : "#ff4444"}
        />
        <StatCard
          label="贖罪完了"
          value={`${status.redemptions.length} 件`}
          sub="記事投稿 / 寄付"
          color="#4488ff"
        />
      </div>

      {/* 加担履歴 */}
      {status.history.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📜 加担履歴</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>日時</th>
                <th style={styles.th}>数量</th>
                <th style={styles.th}>金額</th>
              </tr>
            </thead>
            <tbody>
              {status.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <tr key={i}>
                    <td style={styles.td}>
                      {new Date(h.date).toLocaleString("ja-JP")}
                    </td>
                    <td style={styles.td}>{h.quantity}箱</td>
                    <td style={{ ...styles.td, color: "#ff4444" }}>
                      ¥{h.cost?.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 贖罪履歴 */}
      {status.redemptions.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🕊️ 贖罪履歴</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>日時</th>
                <th style={styles.th}>判定理由</th>
                <th style={styles.th}>リンク</th>
              </tr>
            </thead>
            <tbody>
              {status.redemptions
                .slice()
                .reverse()
                .map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>
                      {new Date(r.date).toLocaleString("ja-JP")}
                    </td>
                    <td style={styles.td}>{r.reason}</td>
                    <td style={styles.td}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#4488ff" }}
                      >
                        開く
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {/* フッター */}
      <footer style={styles.footer}>
        <p>The Watcher — タバコ税の防衛費転用に抗議する禁煙監視システム</p>
        <p style={{ opacity: 0.4, fontSize: "0.75rem" }}>
          Powered by Claude API + GitHub Actions + Pushover
        </p>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: "bold", color, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "'Noto Sans JP', 'Segoe UI', sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 900,
    letterSpacing: "0.3em",
    margin: 0,
    background: "linear-gradient(90deg, #ff4444, #ff8800, #ff4444)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    opacity: 0.5,
    marginTop: "0.5rem",
    fontSize: "0.9rem",
  },
  banner: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    borderRadius: 12,
    marginBottom: "2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  card: {
    background: "#141414",
    border: "1px solid #333",
    borderRadius: 10,
    padding: "1.2rem",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    marginBottom: "0.8rem",
    borderBottom: "1px solid #333",
    paddingBottom: "0.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "0.6rem",
    borderBottom: "1px solid #333",
    fontSize: "0.8rem",
    opacity: 0.6,
  },
  td: {
    padding: "0.6rem",
    borderBottom: "1px solid #1a1a1a",
    fontSize: "0.9rem",
  },
  footer: {
    textAlign: "center",
    marginTop: "3rem",
    opacity: 0.4,
    fontSize: "0.85rem",
  },
};
