#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  The Watcher — CLI Guard
#  claude / gemini コマンドを禁煙違反時にブロックする
#
#  使い方: source this file in your .zshrc / .bashrc
#    source /path/to/watcher_cli.sh
# ═══════════════════════════════════════════════════════════

WATCHER_REPO="tamaki2001/watcher"

_watcher_check() {
  local cmd_name="$1"
  shift

  # GitHubからstatus.jsonを取得（rawコンテンツ）
  local status_url="https://raw.githubusercontent.com/${WATCHER_REPO}/main/data/status.json"
  local status
  status=$(curl -sf --max-time 5 "$status_url" 2>/dev/null)

  if [ $? -ne 0 ]; then
    # ネットワークエラー時はフェイルオープン（通す）
    command "$cmd_name" "$@"
    return
  fi

  local is_locked
  is_locked=$(echo "$status" | jq -r '.isLocked' 2>/dev/null)

  if [ "$is_locked" = "true" ]; then
    local expires
    expires=$(echo "$status" | jq -r '.lockExpiresAt // "不明"' 2>/dev/null)
    local complicity
    complicity=$(echo "$status" | jq -r '.stats.complicityBudget // 0' 2>/dev/null)

    # 残り時間を計算
    local now_epoch expires_epoch remaining_hours
    now_epoch=$(date +%s)
    expires_epoch=$(date -d "$expires" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$expires" +%s 2>/dev/null || echo 0)
    if [ "$expires_epoch" -gt 0 ] 2>/dev/null; then
      remaining_hours=$(( (expires_epoch - now_epoch) / 3600 ))
    else
      remaining_hours="?"
    fi

    echo ""
    echo "  ╔══════════════════════════════════════════════════════════╗"
    echo "  ║           ⛔ THE WATCHER: アクセス拒否                  ║"
    echo "  ╠══════════════════════════════════════════════════════════╣"
    echo "  ║                                                          ║"
    echo "  ║  平和を裏切った者にAIを使う資格はない。                  ║"
    echo "  ║                                                          ║"
    echo "  ║  あなたの加担額: 累計 ${complicity}円 → 軍事費へ          "
    echo "  ║  解除まで残り: 約 ${remaining_hours} 時間                 "
    echo "  ║                                                          ║"
    echo "  ║  解除方法:                                               ║"
    echo "  ║   1. noteに1000字以上の政治批判記事を投稿                ║"
    echo "  ║   2. または反戦団体への寄付証明を提出                    ║"
    echo "  ║                                                          ║"
    echo "  ║  → GitHub Actions で 'request_unlock' を実行せよ         ║"
    echo "  ║                                                          ║"
    echo "  ╚══════════════════════════════════════════════════════════╝"
    echo ""
    return 1
  fi

  # ロックされていなければ通常実行
  # 阻止カウント（ロック中でなくても、実行するたびに「阻止した」とカウント）
  command "$cmd_name" "$@"
}

# エイリアス定義
claude() { _watcher_check claude "$@"; }
gemini() { _watcher_check gemini "$@"; }

# git commit もブロック対象にする場合（オプション）
git() {
  if [ "$1" = "commit" ] || [ "$1" = "push" ]; then
    # git commit/push もロック時はブロック
    local status_url="https://raw.githubusercontent.com/${WATCHER_REPO}/main/data/status.json"
    local is_locked
    is_locked=$(curl -sf --max-time 5 "$status_url" 2>/dev/null | jq -r '.isLocked' 2>/dev/null)

    if [ "$is_locked" = "true" ]; then
      echo ""
      echo "  ⛔ THE WATCHER: git $1 はロック中は禁止されています。"
      echo "  贖罪を完了してから開発を再開してください。"
      echo ""
      return 1
    fi
  fi
  command git "$@"
}

echo "🔍 The Watcher CLI Guard: 有効化されました"
echo "   監視対象: claude, gemini, git commit/push"
