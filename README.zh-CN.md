# agent-recess

[English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | 简体中文

一个用于 Claude Code 和 Codex CLI 的钩子（hook）。它会发现你和编程智能体已经连续工作太久，然后提醒你出去走走。

提醒的内容由**运行在本机 Ollama 上的 Gemma 4** 生成，并且会根据外面的实际天气而变化。

晴朗的下午：

```
🌿 你已经连续工作了94分钟了，该起身活动一下了。建议你出去散步五到十五分钟，
去看看周围的街角或者公园，呼吸点新鲜空气。
```

下雨时：

```
🌿 已经专注了94分钟了，湿漉漉的天气需要一点休息。花10到15分钟完全待在室内，
打开窗户让空气流通，好好伸个懒腰，然后给自己倒杯水。
```

## 工作原理

- 每次你发送提示词，或者智能体完成一次回复时，钩子都会记录时间。
- 间隔 15 分钟以上视为已经休息，连续工作时间归零。不同终端、不同智能体中的会话共用同一个连续工作时间。
- 超过 90 分钟后，在智能体完成回复时显示一条建议。它不会阻塞智能体，并且至少间隔 30 分钟才会再次提醒。
- 如果 Ollama 没有运行，或者无法获取天气，则显示一条固定的提示。

### 哪些信息会离开你的电脑

- **发给模型的内容：** 只有连续工作时间、本地时间和天气。绝不包含你的代码、提示词或文件。运行 `agent-recess preview` 可以看到发送给模型的完整提示词。
- **发往互联网的内容：** 只有你配置的经纬度，发送给 [Open-Meteo](https://open-meteo.com/) 用于查询天气。默认不配置任何位置。

## 安装

需要 Node.js 20 以上版本和 [Ollama](https://ollama.com/)。

```bash
ollama pull gemma4:e2b-it-qat   # 4.3 GB
npm install -g github:spa77k/agent-recess
agent-recess preview
```

`preview` 会立即生成一条建议，可以用来确认 Gemma 是否正常响应。

### Claude Code

添加到 `~/.claude/settings.json`：

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

添加到 `~/.codex/hooks.json`，然后在 Codex 中运行 `/hooks` 进行审查并信任这些钩子：

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

## 配置

创建 `~/.agent-recess/config.json`。所有字段都可以省略。想要中文建议，请设置 `"language": "zh"`。

```json
{
  "latitude": 31.23,
  "longitude": 121.47,
  "thresholdMinutes": 90,
  "breakGapMinutes": 15,
  "cooldownMinutes": 30,
  "model": "gemma4:e2b-it-qat",
  "language": "zh"
}
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `latitude`、`longitude` | 无 | 查询天气的位置。不设置时，建议不会参考天气。 |
| `thresholdMinutes` | `90` | 第一次提醒前的连续工作时间（分钟） |
| `breakGapMinutes` | `15` | 视为休息的空闲时间（分钟） |
| `cooldownMinutes` | `30` | 两次提醒之间的最短间隔（分钟） |
| `model` | `gemma4:e2b-it-qat` | 任意 Ollama 模型名 |
| `language` | `en` | `en`、`ja`、`ko`、`zh` |

如果 Ollama 不在 `localhost:11434` 上运行，请设置环境变量 `OLLAMA_HOST`。

## 命令

| 命令 | 作用 |
|---|---|
| `agent-recess status` | 显示当前的连续工作时间，以及距离下一次提醒的时间 |
| `agent-recess snooze [分钟]` | 暂停提醒（默认 60 分钟，`0` 表示取消暂停） |
| `agent-recess preview [分钟]` | 立即生成一条建议，并打印发送给模型的完整提示词 |

## 许可证

MIT。天气数据由 [Open-Meteo](https://open-meteo.com/) 提供，依据 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授权使用。
