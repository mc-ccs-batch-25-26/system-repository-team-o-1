import verbalAbility from './questions/verbal-ability.json';
import quantitativeAbility from './questions/quantitative-ability.json';
import logicalReasoning from './questions/logical-reasoning.json';

export interface MockQuestion {
  id: string;
  category: string;
  subcategory: string;
  difficulty: number | string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  source: string;
  tags: string[];
}

// Map difficulty strings to numbers
const normalizeQuestion = (q: any): MockQuestion => ({
  ...q,
  difficulty: typeof q.difficulty === 'string' 
    ? ({ easy: 1, medium: 2, hard: 3 } as Record<string, number>)[q.difficulty] || 1 
    : q.difficulty,
  correct: q.correctAnswer || q.correct,
});

export const MOCK_QUESTIONS: Record<string, MockQuestion[]> = {
  'Verbal Ability': (verbalAbility as any).questions.map(normalizeQuestion),
  'Quantitative Ability': (quantitativeAbility as any).questions.map(normalizeQuestion),
  'Logical Reasoning': (logicalReasoning as any).questions.map(normalizeQuestion),
};

export const CATEGORIES = ['Verbal Ability', 'Quantitative Ability', 'Logical Reasoning'];

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};