import {
  RuleBasedTutor,
  TemplateScheduleParser,
  TemplateSummaryWriter,
} from './ai';
import type { WeeklySummaryData } from './ai';

describe('RuleBasedTutor', () => {
  const tutor = new RuleBasedTutor();

  it('returns 3 hints', async () => {
    const hints = await tutor.getHints('math.add', 'wrong', 'ru');
    expect(hints).toHaveLength(3);
  });

  it('returns nudge, question, explanation levels in order', async () => {
    const hints = await tutor.getHints('math.add', null, 'ru');
    expect(hints[0]!.level).toBe('nudge');
    expect(hints[1]!.level).toBe('question');
    expect(hints[2]!.level).toBe('explanation');
  });

  it('includes skillCode in nudge text', async () => {
    const hints = await tutor.getHints('science.plants', null, 'ru');
    expect(hints[0]!.text).toContain('science.plants');
  });
});

describe('TemplateScheduleParser', () => {
  const parser = new TemplateScheduleParser();

  it('returns a schedule with an rrule and title', async () => {
    const result = await parser.parse('понедельник', 'ru');
    expect(result.rrule).toBeTruthy();
    expect(result.title).toBeTruthy();
  });
});

describe('TemplateSummaryWriter', () => {
  const writer = new TemplateSummaryWriter();

  const data: WeeklySummaryData = {
    childId: 'c1',
    weekStart: '2024-01-01',
    studyMinutes: 120,
    masteredSkills: ['math.add', 'math.sub'],
    hardSkills: ['math.mul'],
    completedSessions: 5,
    goalProgress: [],
  };

  it('returns a non-empty string', async () => {
    const text = await writer.write(data, 'ru');
    expect(text.length).toBeGreaterThan(0);
  });

  it('includes studyMinutes in output', async () => {
    const text = await writer.write(data, 'ru');
    expect(text).toContain('120');
  });

  it('includes mastered skills count', async () => {
    const text = await writer.write(data, 'ru');
    expect(text).toContain('2');
  });
});
