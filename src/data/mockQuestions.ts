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


const MISTAKES_KEY = 'civiquest_mistakes';

export interface SavedMistake {
  id: string;
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  selected_answer: string;
  category_name: string;
  created_at: string;
}

export const saveMistake = (question: MockQuestion, selectedAnswer: string, category: string) => {
  const mistakes: SavedMistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
  
  if (selectedAnswer === question.correct) return;
  
  const exists = mistakes.find(m => m.question_id === question.id);
  if (exists) return;
  
  mistakes.unshift({
    id: Date.now().toString(),
    question_id: question.id,
    question_text: question.question,
    options: question.options,
    correct_answer: question.correct,
    selected_answer: selectedAnswer,
    category_name: category || question.category,
    created_at: new Date().toISOString(),
  });
  
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
};

export const getMistakes = (): SavedMistake[] => {
  return JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
};

// Map difficulty strings to numbers
const normalizeQuestion = (q: any, category: string): MockQuestion => ({
  ...q,
  category,
  difficulty: typeof q.difficulty === 'string' 
    ? ({ easy: 1, medium: 2, hard: 3 } as Record<string, number>)[q.difficulty] || 1 
    : q.difficulty,
  correct: q.correctAnswer || q.correct,
});

export const MOCK_QUESTIONS: Record<string, MockQuestion[]> = {
  'Verbal Ability': (verbalAbility as any).questions.map((q: any) => normalizeQuestion(q, 'Verbal Ability')),
  'Quantitative Ability': (quantitativeAbility as any).questions.map((q: any) => normalizeQuestion(q, 'Quantitative Ability')),
  'Logical Reasoning': (logicalReasoning as any).questions.map((q: any) => normalizeQuestion(q, 'Logical Reasoning')),
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