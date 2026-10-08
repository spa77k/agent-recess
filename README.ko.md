# agent-recess

[English](README.md) | [日本語](README.ja.md) | 한국어 | [简体中文](README.zh-CN.md)

Claude Code와 Codex CLI용 훅입니다. 코딩 에이전트와 너무 오래 작업하고 있다는 것을 알아채고, 밖에 나가 바람 좀 쐬라고 권합니다.

권하는 문장은 **내 컴퓨터의 Ollama에서 돌아가는 Gemma 4**가 씁니다. 내용은 지금 바깥 날씨에 맞춰 달라집니다.

맑은 오후:

```
🌿 94분 동안 정말 열심히 작업하셨네요. 지금 바로 5분에서 10분 정도 짧게 밖에 나가서 햇볕을 쬐고
주변을 둘러보세요. 잠시 머리를 환기하면 코딩 아이디어도 더 잘 떠오를 거예요.
```

비 오는 날:

```
🌿 94분 동안 정말 열심히 일하셨네요. 창문 열고 가볍게 몸 쭉 펴시면서 물 한 잔 마시며
10분 정도 잠시 쉬어보세요.
```

## 작동 방식

- 프롬프트를 보낼 때와 에이전트가 응답을 마칠 때마다 훅이 시각을 기록합니다.
- 15분 이상 비면 휴식한 것으로 보고 연속 작업 시간을 0으로 되돌립니다. 다른 터미널이나 다른 에이전트에서 작업해도 연속 작업 시간은 하나로 합쳐서 셉니다.
- 90분이 넘으면 에이전트가 응답을 마쳤을 때 제안이 표시됩니다. 에이전트의 작업을 막지 않으며, 다음 제안까지는 30분을 기다립니다.
- Ollama가 실행 중이 아니거나 날씨를 가져올 수 없으면 정해진 문장을 대신 표시합니다.

### 컴퓨터 밖으로 나가는 정보

- **모델에 전달하는 것:** 연속 작업 시간, 현지 시각, 날씨뿐입니다. 코드, 프롬프트, 파일 내용은 전달하지 않습니다. `agent-recess preview`를 실행하면 모델에 보내는 프롬프트를 그대로 볼 수 있습니다.
- **인터넷으로 보내는 것:** 설정한 위도와 경도뿐입니다. 날씨를 확인하기 위해 [Open-Meteo](https://open-meteo.com/)로 보냅니다. 기본 상태에서는 위치가 설정되어 있지 않습니다.

## 설치

Node.js 20 이상과 [Ollama](https://ollama.com/)가 필요합니다.

```bash
ollama pull gemma4:e2b-it-qat   # 4.3 GB
npm install -g github:spa77k/agent-recess
agent-recess preview
```

`preview`는 그 자리에서 제안을 하나 만들기 때문에 Gemma가 응답하는지 확인할 수 있습니다.

### Claude Code

`~/.claude/settings.json`에 추가합니다.

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

`~/.codex/hooks.json`에 추가한 뒤, Codex에서 `/hooks`를 실행해 내용을 검토하고 신뢰하도록 설정합니다.

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

## 설정

`~/.agent-recess/config.json`을 만듭니다. 모든 항목은 생략할 수 있습니다. 한국어로 제안받으려면 `"language": "ko"`로 설정합니다.

```json
{
  "latitude": 37.57,
  "longitude": 126.98,
  "thresholdMinutes": 90,
  "breakGapMinutes": 15,
  "cooldownMinutes": 30,
  "model": "gemma4:e2b-it-qat",
  "language": "ko"
}
```

| 항목 | 기본값 | 의미 |
|---|---|---|
| `latitude`, `longitude` | 없음 | 날씨를 확인할 위치. 설정하지 않으면 날씨 없이 제안합니다. |
| `thresholdMinutes` | `90` | 첫 제안까지의 연속 작업 시간(분) |
| `breakGapMinutes` | `15` | 휴식으로 간주하는 유휴 시간(분) |
| `cooldownMinutes` | `30` | 다음 제안까지의 최소 간격(분) |
| `model` | `gemma4:e2b-it-qat` | Ollama 모델 이름 |
| `language` | `en` | `en`, `ja`, `ko`, `zh` |

Ollama가 `localhost:11434`가 아닌 곳에서 실행 중이라면 환경 변수 `OLLAMA_HOST`를 설정합니다.

## 명령어

| 명령어 | 하는 일 |
|---|---|
| `agent-recess status` | 현재 연속 작업 시간과 다음 제안까지 남은 시간을 표시합니다 |
| `agent-recess snooze [분]` | 제안을 일시 중지합니다(기본값 60분, `0`이면 해제) |
| `agent-recess preview [분]` | 그 자리에서 제안을 만들고 모델에 보낸 프롬프트를 그대로 출력합니다 |

## 라이선스

MIT. 날씨 데이터는 [Open-Meteo](https://open-meteo.com/)가 제공하며 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)에 따라 이용합니다.
