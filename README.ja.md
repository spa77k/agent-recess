# agent-recess

[English](README.md) | 日本語

Claude CodeとCodex CLIのフックです。コーディングエージェントとの作業が長く続いていることに気づき、「外に出よう」とすすめます。

すすめる文は、**手元のPCのOllamaで動くGemma 4**が作ります。内容は今の天気に合わせて変わります。

晴れた昼:

```
🌿 94分も集中していたね、そろそろ休憩のサインだよ。外の景色を見るために5分から15分くらい、
ちょっと散歩に出かけて、空を眺めてごらん。
```

雨の日:

```
🌿 94分も集中していたね。今日は天気が残念だから、窓を開けて体を伸ばしたり、水を補給したりして、
10分くらい休憩しよう。
```

## しくみ

- プロンプトを送ったときと、エージェントの応答が終わったときに、フックが時刻を記録します。
- 15分以上あくと休憩したとみなし、連続作業時間を0に戻します。別のターミナルや別のエージェントで作業していても、連続作業時間は1つにまとめて数えます。
- 90分を超えると、エージェントの応答が終わったときに提案が表示されます。エージェントの作業は止めません。次の提案までは30分あけます。
- Ollamaが動いていないときや天気が取れないときは、決まった文を表示します。

### PCの外に出る情報

- **モデルに渡すもの:** 連続作業時間、現地の時刻、天気だけです。コード、プロンプト、ファイルの中身は渡しません。`agent-recess preview` で、モデルに送る文をそのまま確認できます。
- **インターネットに送るもの:** 設定した緯度と経度だけです。天気を調べるために [Open-Meteo](https://open-meteo.com/) へ送ります。初期状態では場所は設定されていません。

## 入れ方

Node.js 20以上と [Ollama](https://ollama.com/) が必要です。

```bash
ollama pull gemma4:e2b-it-qat   # 4.3 GB
npm install -g github:spa77k/agent-recess
agent-recess preview
```

`preview` はその場で提案を1つ作るので、Gemmaが答えるかどうかを確かめられます。

### Claude Code

`~/.claude/settings.json` に追加します。

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "agent-recess hook" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "agent-recess hook", "timeout": 30 }] }
    ]
  }
}
```

### Codex CLI

`~/.codex/hooks.json` に追加し、Codexで `/hooks` を実行して内容を確認・承認します。

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "agent-recess hook", "timeout": 30 }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "agent-recess hook", "timeout": 30 }] }
    ]
  }
}
```

## 設定

`~/.agent-recess/config.json` を作ります。どの項目も省略できます。日本語で提案してほしいときは `"language": "ja"` にします。

```json
{
  "latitude": 35.68,
  "longitude": 139.76,
  "thresholdMinutes": 90,
  "breakGapMinutes": 15,
  "cooldownMinutes": 30,
  "model": "gemma4:e2b-it-qat",
  "language": "ja"
}
```

| 項目 | 初期値 | 意味 |
|---|---|---|
| `latitude`、`longitude` | なし | 天気を調べる場所。設定しないと、天気を使わずに提案します。 |
| `thresholdMinutes` | `90` | 最初の提案までの連続作業時間（分） |
| `breakGapMinutes` | `15` | 休憩とみなす、何もしていない時間（分） |
| `cooldownMinutes` | `30` | 次の提案までにあける時間（分） |
| `model` | `gemma4:e2b-it-qat` | Ollamaのモデル名 |
| `language` | `en` | `en` か `ja` |

Ollamaが `localhost:11434` 以外で動いている場合は、環境変数 `OLLAMA_HOST` を設定します。

## コマンド

| コマンド | できること |
|---|---|
| `agent-recess status` | 今の連続作業時間と、次の提案までの残り時間を表示します |
| `agent-recess snooze [分]` | 提案を一時停止します（初期値は60分。`0` で解除） |
| `agent-recess preview [分]` | その場で提案を作り、モデルに送った文をそのまま表示します |

## ライセンス

MIT。天気データは [Open-Meteo](https://open-meteo.com/) の提供で、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) のもとで利用しています。
