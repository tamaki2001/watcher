# ═══════════════════════════════════════════════════════════
#  The Watcher — PowerShell CLI Guard
#  claude / gemini コマンドを禁煙違反時にブロックする
#
#  使い方: ターミナルで以下を実行
#    . .\scripts\watcher_cli.ps1
# ═══════════════════════════════════════════════════════════

$WATCHER_REPO = if ($env:WATCHER_REPO) { $env:WATCHER_REPO } elseif ($env:GITHUB_REPO) { $env:GITHUB_REPO } else { "tamaki2001/watcher" }

function _Watcher-Check {
    param (
        [string]$CommandName,
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )

    try {
        # GitHubからstatus.jsonを取得
        $jsonBase64 = gh api "repos/$WATCHER_REPO/contents/data/status.json" --jq '.content' 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($jsonBase64)) {
            throw "GitHub API error"
        }

        $jsonBytes = [System.Convert]::FromBase64String($jsonBase64)
        $jsonText = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
        $status = $jsonText | ConvertFrom-Json

        if ($status.isLocked -eq $true) {
            $expires = if ($status.lockExpiresAt) { $status.lockExpiresAt } else { "不明" }
            $complicity = if ($status.stats.complicityBudget) { $status.stats.complicityBudget } else { 0 }

            # 残り時間の計算
            $remainingHours = "?"
            try {
                $expiresDate = [DateTime]::Parse($expires).ToUniversalTime()
                $now = [DateTime]::UtcNow
                $diff = $expiresDate - $now
                if ($diff.TotalHours -gt 0) {
                    $remainingHours = [Math]::Floor($diff.TotalHours)
                }
            } catch {}

            Write-Host ""
            Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Red
            Write-Host "  ║           ⛔ THE WATCHER: アクセス拒否                  ║" -ForegroundColor Red
            Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Red
            Write-Host "  ║                                                          ║"
            Write-Host "  ║  平和を裏切った者にAIを使う資格はない。                  ║"
            Write-Host "  ║                                                          ║"
            Write-Host "  ║  あなたの加担額: 累計 $($complicity)円 -> 軍事費へ          "
            Write-Host "  ║  解除まで残り: 約 $($remainingHours) 時間                 "
            Write-Host "  ║                                                          ║"
            Write-Host "  ║  解除方法:                                               ║"
            Write-Host "  ║   1. noteに1000字以上の政治批判記事を投稿                ║"
            Write-Host "  ║   2. または反戦団体への寄付証明を提出                    ║"
            Write-Host "  ║                                                          ║"
            Write-Host "  ║  -> GitHub Actions で 'request_unlock' を実行せよ         ║"
            Write-Host "  ║                                                          ║"
            Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Red
            Write-Host ""
            return
        }
    } catch {
        # エラー時はフェイルオープン
    }

    # ロックされていなければ本来のコマンドを実行
    $realCommand = Get-Command $CommandName -CommandType Application -ErrorAction SilentlyContinue
    if ($realCommand) {
        & $realCommand.Source @CommandArgs
    } else {
        if ($CommandArgs) {
            & $CommandName @CommandArgs
        } else {
            & $CommandName
        }
    }
}

function claude { _Watcher-Check "claude" @args }
function gemini { _Watcher-Check "gemini" @args }

Write-Host "🔍 The Watcher CLI Guard (PowerShell): Enabled" -ForegroundColor Cyan
Write-Host "   Targets: claude, gemini" -ForegroundColor Cyan
