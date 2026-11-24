import * as Speech from 'expo-speech';

export function speakEnglish(word: string): void {
  Speech.stop();
  Speech.speak(word, { language: 'en-US', rate: 0.85, pitch: 1.0 });
}

export function stopSpeech(): void {
  Speech.stop();
}
