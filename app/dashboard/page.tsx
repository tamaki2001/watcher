"use client";

import { useEffect, useState, useCallback } from "react";

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
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unlockUrl, setUnlockUrl] = useState("");

  const fetchStatus = useCallback(() => {
    fetch(STATUS_URL, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setStatus)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const dispatch = async (eventType: string, payload?: Record<string, string>) => {
    setSending(eventType);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { event_type: eventType };
      if (payload) body.client_payload = payload;

      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage("送信完了。反映まで数秒かかります。");
        setTimeout(fetchStatus, 10000);
      } else {
        const data = await res.json();
        setMessage(`エラー: ${data.error || "不明"}`);
      }
    } catch {
      setMessage("通信エラー");
    } finally {
      setSending(null);
    }
  };

  if (error) {
    return (
      <div style={s.container}>
        <h1 style={s.title}>データ取得エラー</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={s.container}>
        <p style={{ textAlign: "center", opacity: 0.5, padding: "4rem 0" }}>
          監視データ読込中...
        </p>
      </div>
    );
  }

  const netBudget = status.stats.blockedBudget - status.stats.complicityBudget;

  return (
    <div style={s.container}>
      {/* ヘッダー */}
      <header style={s.header}>
        <h1 style={s.title}>THE WATCHER</h1>
        <p style={s.subtitle}>禁煙監視システム — Claude Edition</p>
      </header>

      {/* ステータスバナー */}
      <div
        style={{
          ...s.banner,
          background: status.isLocked
            ? "linear-gradient(135deg, #8b0000, #4a0000)"
            : "linear-gradient(135deg, #004d00, #001a00)",
          border: `1px solid ${status.isLocked ? "#ff4444" : "#44ff44"}`,
        }}
      >
        <span style={{ fontSize: "2rem" }}>
          {status.isLocked ? "\u{1F512}" : "\u2705"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
            {status.isLocked
              ? "LOCKED \u2014 CLI\u7121\u52B9\u5316\u4E2D"
              : `禁煙 ${status.streak.days} 日目`}
          </div>
          {status.isLocked && status.lockExpiresAt && (
            <div style={{ opacity: 0.8, marginTop: 4, fontSize: "0.85rem" }}>
              解除期限: {new Date(status.lockExpiresAt).toLocaleString("ja-JP")}
            </div>
          )}
          {!status.isLocked && (
            <div style={{ opacity: 0.8, marginTop: 4, fontSize: "0.85rem" }}>
              開始日: {status.streak.startDate}
            </div>
          )}
        </div>
      </div>

      {/* フィードバックメッセージ */}
      {message && (
        <div style={s.feedback}>{message}</div>
      )}

      {/* 購入報告セクション */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>購入報告</h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.5, margin: "0 0 0.8rem" }}>
          買ってしまった場合はここから報告。24時間CLIがロックされます。
        </p>
        <div style={s.buttonRow}>
          {[
            { label: "1箱 (¥40)", event: "buy_1" },
            { label: "2箱 (¥80)", event: "buy_2" },
            { label: "3箱 (¥120)", event: "buy_3" },
            { label: "カートン (¥400)", event: "buy_carton" },
          ].map((b) => (
            <button
              key={b.event}
              style={{
                ...s.btnDanger,
                opacity: sending ? 0.5 : 1,
              }}
              disabled={!!sending}
              onClick={() => {
                if (confirm(`${b.label}を報告しますか？ロックが発動します。`)) {
                  dispatch(b.event);
                }
              }}
            >
              {sending === b.event ? "送信中..." : b.label}
            </button>
          ))}
        </div>
      </section>

      {/* 解除申請セクション */}
      {status.isLocked && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>贖罪・解除申請</h2>
          <p style={{ fontSize: "0.8rem", opacity: 0.5, margin: "0 0 0.8rem" }}>
            noteの記事URL or 寄付証明URLを提出してください。Claudeが内容を検証します。
          </p>
          <div style={s.unlockForm}>
            <input
              type="url"
              placeholder="https://note.com/..."
              value={unlockUrl}
              onChange={(e) => setUnlockUrl(e.target.value)}
              style={s.input}
            />
            <button
              style={{
                ...s.btnPrimary,
                opacity: sending || !unlockUrl ? 0.5 : 1,
              }}
              disabled={!!sending || !unlockUrl}
              onClick={() => {
                if (confirm("この記事/証明で解除を申請しますか？")) {
                  dispatch("unlock_request", { url: unlockUrl });
                  setUnlockUrl("");
                }
              }}
            >
              {sending === "unlock_request" ? "検証中..." : "解除を申請"}
            </button>
          </div>
        </section>
      )}

      {/* 統計カード */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>統計</h2>
        <div style={s.grid}>
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
      </section>

      {/* 加担履歴 */}
      {status.history.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>加担履歴</h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>日時</th>
                  <th style={s.th}>数量</th>
                  <th style={s.th}>金額</th>
                </tr>
              </thead>
              <tbody>
                {status.history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <tr key={i}>
                      <td style={s.td}>
                        {new Date(h.date).toLocaleString("ja-JP")}
                      </td>
                      <td style={s.td}>{h.quantity}箱</td>
                      <td style={{ ...s.td, color: "#ff4444" }}>
                        ¥{h.cost?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 贖罪履歴 */}
      {status.redemptions.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>贖罪履歴</h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>日時</th>
                  <th style={s.th}>判定理由</th>
                  <th style={s.th}>リンク</th>
                </tr>
              </thead>
              <tbody>
                {status.redemptions
                  .slice()
                  .reverse()
                  .map((r, i) => (
                    <tr key={i}>
                      <td style={s.td}>
                        {new Date(r.date).toLocaleString("ja-JP")}
                      </td>
                      <td style={s.td}>{r.reason}</td>
                      <td style={s.td}>
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
          </div>
        </section>
      )}

      {/* フッター */}
      <footer style={s.footer}>
        <p>the Watcher - たばこ税の防衛費転用に抗議する禁煙監視システム</p>
        <p style={{ opacity: 0.4, fontSize: "0.7rem", marginTop: "0.3rem" }}>
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
    <div style={s.card}>
      <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{label}</div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: 4 }}>
        {sub}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "1.5rem 1rem",
    fontFamily: "'Noto Sans JP', 'Segoe UI', system-ui, sans-serif",
    minHeight: "100dvh",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "0.2em",
    margin: 0,
    background: "linear-gradient(90deg, #ff4444, #ff8800, #ff4444)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    opacity: 0.5,
    marginTop: "0.3rem",
    fontSize: "0.8rem",
  },
  banner: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
    padding: "1rem",
    borderRadius: 12,
    marginBottom: "1rem",
  },
  feedback: {
    background: "#1a1a2e",
    border: "1px solid #4488ff",
    borderRadius: 8,
    padding: "0.8rem",
    marginBottom: "1rem",
    fontSize: "0.85rem",
    textAlign: "center" as const,
    color: "#88bbff",
  },
  section: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
    borderBottom: "1px solid #333",
    paddingBottom: "0.4rem",
  },
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
  },
  btnDanger: {
    background: "#2a0a0a",
    border: "1px solid #662222",
    borderRadius: 8,
    color: "#ff6666",
    padding: "0.8rem 0.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnPrimary: {
    background: "#0a1a2a",
    border: "1px solid #225588",
    borderRadius: 8,
    color: "#66aaff",
    padding: "0.8rem 1.2rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  unlockForm: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    background: "#141414",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#e0e0e0",
    padding: "0.8rem",
    fontSize: "0.85rem",
    outline: "none",
    minWidth: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.5rem",
  },
  card: {
    background: "#141414",
    border: "1px solid #333",
    borderRadius: 10,
    padding: "1rem",
  },
  tableWrap: {
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.85rem",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.5rem",
    borderBottom: "1px solid #333",
    fontSize: "0.75rem",
    opacity: 0.6,
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "0.5rem",
    borderBottom: "1px solid #1a1a1a",
    fontSize: "0.8rem",
  },
  footer: {
    textAlign: "center" as const,
    marginTop: "2rem",
    opacity: 0.4,
    fontSize: "0.8rem",
  },
};
