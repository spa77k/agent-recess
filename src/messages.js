// Used when the local model or the weather API is unavailable.
const FALLBACK = {
  en: (minutes) =>
    `You've been coding with your agent for ${minutes} minutes. Stand up, stretch, look at something far away, and come back in 10.`,
  ja: (minutes) =>
    `エージェントと${minutes}分作業が続いています。立ち上がって体を伸ばし、遠くを見て、10分後に戻りましょう。`,
};

export function fallbackMessage(minutes, language) {
  return (FALLBACK[language] ?? FALLBACK.en)(minutes);
}
