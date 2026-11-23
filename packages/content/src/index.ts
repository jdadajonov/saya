import multiplicationSkills from './skills/multiplication.json';
import englishA1Skills from './skills/english-a1.json';

export { multiplicationSkills, englishA1Skills };

export type SkillEntry = {
  code: string;
  label: Record<string, string>;
  parent: string | null;
  prerequisites: string[];
};
