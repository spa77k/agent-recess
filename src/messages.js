// Used when the local model or the weather API is unavailable.
const FALLBACK = {
  en: (minutes) =>
    `You've been coding with your agent for ${minutes} minutes. Stand up, stretch, look at something far away, and come back in 10.`,
  ja: (minutes) =>
    `エージェントと${minutes}分作業が続いています。立ち上がって体を伸ばし、遠くを見て、10分後に戻りましょう。`,
  ko: (minutes) =>
    `에이전트와 ${minutes}분째 작업 중입니다. 일어나서 스트레칭하고, 먼 곳을 바라본 뒤 10분 후에 돌아오세요.`,
  zh: (minutes) =>
    `你已经和智能体连续工作了 ${minutes} 分钟。站起来伸展一下，看看远处，10 分钟后再回来。`,
};

export function fallbackMessage(minutes, language) {
  return (FALLBACK[language] ?? FALLBACK.en)(minutes);
}
