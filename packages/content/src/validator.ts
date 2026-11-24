import { z } from 'zod';
import englishA1 from './exercises/english-a1.json';

const WordSchema = z.object({
  en: z.string().min(1),
  ru: z.string().min(1),
  uz: z.string().min(1),
});

const TopicSchema = z.object({
  skillCode: z.string().regex(/^en\.a1\./),
  words: z.array(WordSchema).min(4),
});

const WordBankSchema = z.object({
  subject: z.literal('english'),
  topics: z.array(TopicSchema).min(1),
});

function validateWordBank(): void {
  const result = WordBankSchema.safeParse(englishA1);
  if (!result.success) {
    throw new Error(
      'Word bank validation failed:\n' +
      result.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }

  for (const topic of result.data.topics) {
    const words = topic.words.map((w) => w.en.toLowerCase());
    const unique = new Set(words);
    if (unique.size !== words.length) {
      throw new Error(`Duplicate English words in topic ${topic.skillCode}`);
    }
    if (topic.words.length < 4) {
      throw new Error(`Topic ${topic.skillCode} needs ≥ 4 words for distractor generation`);
    }
  }
}

validateWordBank();
