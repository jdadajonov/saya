export interface TutorHint {
  level: 'nudge' | 'question' | 'explanation';
  text: string;
}

export interface TutorProvider {
  getHints(skillCode: string, wrongAnswer: unknown, locale: string): Promise<TutorHint[]>;
}

export interface ParsedSchedule {
  rrule: string;
  title: string;
  place?: string;
}

export interface ScheduleParser {
  parse(input: string, locale: string): Promise<ParsedSchedule>;
}

export interface GeneratedContent {
  exerciseTypeId: string;
  payload: Record<string, unknown>;
  difficulty: number;
}

export interface ContentGenerator {
  generate(skillCode: string, count: number, locale: string): Promise<GeneratedContent[]>;
}

export interface WeeklySummaryData {
  childId: string;
  weekStart: string;
  studyMinutes: number;
  masteredSkills: string[];
  hardSkills: string[];
  completedSessions: number;
  goalProgress: Array<{ goalTitle: string; completedMilestones: number; totalMilestones: number }>;
}

export interface SummaryWriter {
  write(data: WeeklySummaryData, locale: string): Promise<string>;
}

export class RuleBasedTutor implements TutorProvider {
  async getHints(skillCode: string, _wrongAnswer: unknown, _locale: string): Promise<TutorHint[]> {
    return [
      { level: 'nudge', text: `Попробуй ещё раз: ${skillCode}` },
      { level: 'question', text: 'Что ты знаешь об этом?' },
      { level: 'explanation', text: 'Смотри объяснение…' },
    ];
  }
}

export class TemplateScheduleParser implements ScheduleParser {
  async parse(_input: string, _locale: string): Promise<ParsedSchedule> {
    return { rrule: 'FREQ=WEEKLY;BYDAY=MO', title: 'Занятие' };
  }
}

export class TemplateSummaryWriter implements SummaryWriter {
  async write(data: WeeklySummaryData, _locale: string): Promise<string> {
    return (
      `За эту неделю: ${data.studyMinutes} мин учёбы, ` +
      `${data.masteredSkills.length} освоенных навыков, ` +
      `${data.completedSessions} занятий.`
    );
  }
}
