# The Watcher

禁煙アカウンタビリティシステム。たばこ購入時にAIツールをロックし、政治的行動（記事執筆 or 寄付）で解除する。

## コンセプト

日本のたばこ税が防衛費に転用されることへの抗議として禁煙を実践。破った場合の「罰」としてAIツール使用を24時間禁止し、解除には1000文字以上の政治的批評記事の執筆（note.com）または国境なき医師団への寄付証明が必要。

## アーキテクチャ

```
[Dashboard (Vercel)]  ←→  [API Routes]  →  [GitHub Actions]
       ↓                                         ↓
[iPhone Shortcuts]  →  [repository_dispatch]  →  [Claude API]
                                                     ↓
                                              [Pushover通知]
                                                     ↓
                                              [data/status.json (Git)]
```

## スタック

- **フロントエンド**: Next.js 15 + React 19、インラインCSS
- **バックエンド**: Vercel Functions (API Routes) + GitHub Actions (オーケストレーション)
- **AI**: Anthropic Claude API (claude-sonnet-4-6, claude-haiku-4-5)
  - 購入報告時: 防衛費×紛争ニュースを絡めた罪悪感メッセージ生成
  - 解除申請時: 提出URLの内容検証（1000文字以上の政治的批評か、寄付証明か）
- **通知**: Pushover
- **ニュース**: Google News RSS（防衛費、戦争、紛争関連）
- **状態管理**: `data/status.json`（Gitコミットで永続化）

## ディレクトリ構成

```
app/
  page.tsx                # /dashboard へリダイレクト
  layout.tsx              # ダークテーマ、日本語、モバイル対応
  dashboard/page.tsx      # メインUI (693行、クライアントコンポーネント)
  api/
    dispatch/route.ts     # GitHub repository_dispatch トリガー
    news/route.ts         # Google News RSS 取得 (戦争/紛争ニュース)
data/
  status.json             # ロック状態、ストリーク、統計、履歴
scripts/
  watcher_cli.sh          # CLI guard (.bashrc/.zshrcでsource)
.github/workflows/
  watcher.yml             # 7ジョブの中核ワークフロー
```

## GitHub Actions ワークフロー (7ジョブ)

| ジョブ | トリガー | 動作 |
|-------|---------|------|
| report-purchase | 手動 (dashboard) | ロック発動、罪悪感メッセージ送信 |
| iphone-purchase | repository_dispatch | iPhone Shortcuts経由の購入報告 |
| request-unlock | 手動 (dashboard) | Claude APIで提出URLを検証、承認/拒否 |
| dashboard-unlock | repository_dispatch | iPhone Shortcuts経由の解除申請 |
| daily-check | schedule (毎日08:00 JST) | 自動解除、ストリーク更新、激励メッセージ |
| check-status | 手動 | 状態確認のみ（変更なし） |
| proximity-alert | repository_dispatch | コンビニ接近時の警告通知 |

## コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run start    # 本番サーバー
```

## Secrets (GitHub Repository Secrets)

- `CLAUDE_SYSTEM_KEY` — Anthropic API Key (claude-sonnet-4-6/haiku-4-5)
- `PUSHOVER_TOKEN` / `PUSHOVER_USER` — 通知送信
- GitHub PAT — workflow dispatch用 (gh CLIで認証済み)

## 状態ファイル (data/status.json)

```json
{
  "isLocked": false,           // AIツールロック中か
  "lockExpiresAt": null,       // ロック解除予定時刻 (ISO 8601)
  "streak": { "days": 1, "startDate": "2026-04-01" },
  "stats": {
    "blockedCount": 0,         // 誘惑を退けた回数
    "blockedBudget": 0,        // 節約額
    "complicityCount": 0,      // 購入回数
    "complicityBudget": 0      // 購入総額 (円)
  },
  "history": [],               // 購入履歴
  "redemptions": []            // 解除履歴 (URL + 検証理由)
}
```

## 設計上の注意

- `data/status.json` はGitHub Actionsからコミット・プッシュされる。ローカルで編集する場合は先にpullすること
- CLIガード (`watcher_cli.sh`) はfail-open設計: ネットワークエラー時はツール使用を許可
- ダッシュボードは30秒間隔で状態をポーリング
- ニュースAPIは1時間キャッシュ

<!-- COSTVIEWER:START -->
## コスト管理

新しい有料サービスやレート制限のあるAPIを導入する際は、
以下の情報をCost Viewerダッシュボードに登録してください:
- サービス名、種別(従量課金/固定費/レート制限)
- 課金通貨と料金体系
- 使用するAPIキーの環境変数名

現在追跡中のサービス: Claude (claude.ai + CLI), Anthropic Claude API, Google AI (Gemini API), Gemini (Web版), Oura Ring, Vercel, Cloudflare Workers/Pages, GitHub Actions, Supabase, Google Calendar API, GitHub API, Google Drive API, Gmail SMTP, Pushover, Anthropic Claude API (myportfolio)
<!-- COSTVIEWER:END -->
