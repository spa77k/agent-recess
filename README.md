# agent-recess

A hook for Claude Code and Codex CLI that notices when you've been pairing with your coding agent for too long — and tells you to go touch grass.

The suggestion is written on your own machine by **Gemma 4 running in Ollama**, and it fits the actual weather outside:

On a clear afternoon:

```
🌿 Hey, you've been deep in the code for 94 minutes! Take a quick 10-minute walk outside
to get some fresh air and enjoy that clear sky. Go find a corner shop or just take a
moment to look up at the clouds.
```

When it rains:

```
🌿 You've been coding for 94 minutes! Since it's a bit wet out, take a quick 10-minute
breather right where you are. Pop a window open, do some big stretches, and grab a
refill of water to reset your eyes.
```

## How it works

- Every time you send a prompt or the agent finishes a reply, the hook notes the time.
- A gap of 15 minutes or more counts as a break and resets the streak. Sessions in different terminals and different agents share one streak.
- After 90 minutes, when the agent finishes its reply, a suggestion appears. It never blocks the agent, and it waits 30 minutes before suggesting again.
- If Ollama isn't running or the weather can't be fetched, you get a plain fallback message instead.

### What leaves your machine

- **To the model:** the streak length, the local time and the weather. Never your code, prompts or files. Run `agent-recess preview` to see the exact prompt.
- **To the internet:** only your configured latitude and longitude, sent to [Open-Meteo](https://open-meteo.com/) for the weather. No location is configured by default.

## Install

Requires Node.js 20+ and [Ollama](https://ollama.com/).

```bash
ollama pull gemma4:e2b-it-qat   # 4.3 GB
npm install -g github:spa77k/agent-recess
agent-recess preview
```

`preview` generates a suggestion right away, so you can check that Gemma answers.

### Claude Code

Add to `~/.claude/settings.json`:

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

Add to `~/.codex/hooks.json`, then run `/hooks` in Codex to review and trust them:

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

## Configure

Create `~/.agent-recess/config.json`. Every key is optional.

```json
{
  "latitude": 35.68,
  "longitude": 139.76,
  "thresholdMinutes": 90,
  "breakGapMinutes": 15,
  "cooldownMinutes": 30,
  "model": "gemma4:e2b-it-qat",
  "language": "en"
}
```

| Key | Default | Meaning |
|---|---|---|
| `latitude`, `longitude` | none | Where to check the weather. Without them, suggestions ignore the weather. |
| `thresholdMinutes` | `90` | Streak length before the first suggestion |
| `breakGapMinutes` | `15` | Idle time that counts as a break |
| `cooldownMinutes` | `30` | Minimum time between suggestions |
| `model` | `gemma4:e2b-it-qat` | Any Ollama model name |
| `language` | `en` | `en` or `ja` |

Set `OLLAMA_HOST` if Ollama runs somewhere other than `localhost:11434`.

## Commands

| Command | What it does |
|---|---|
| `agent-recess status` | Show your current streak and the time until the next suggestion |
| `agent-recess snooze [minutes]` | Pause suggestions (default 60; `0` clears the snooze) |
| `agent-recess preview [minutes]` | Generate a suggestion now and print the exact prompt sent to the model |

## License

MIT. Weather data by [Open-Meteo](https://open-meteo.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
