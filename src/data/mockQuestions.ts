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
  source_type?: string;
  tags: string[];
}

export const saveMistake = (question: any, selectedAnswer: string, category: string) => {
  const mistakes: SavedMistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
  if (selectedAnswer === (question.correct_answer || question.correct)) return;
  const exists = mistakes.find(m => m.question_id === question.id);
  if (exists) return;
  mistakes.unshift({
    id: Date.now().toString(),
    question_id: question.id,
    question_text: question.question_text || question.question,
    options: question.options || [question.option_a, question.option_b, question.option_c, question.option_d],
    correct_answer: question.correct_answer || question.correct,
    selected_answer: selectedAnswer,
    category_name: category,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
};

export const getMistakes = (): SavedMistake[] => {
  return JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
};

export const CATEGORIES = ['Verbal Ability', 'Numerical Ability', 'Analytical Ability', 'General Information'];

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper to convert DB question to MockQuestion format
export const dbToMockQuestion = (q: any): MockQuestion => {
  // Map A, B, C, D to the actual option text
  let correctAnswerText = q.correct_answer;
  if (q.correct_answer === 'A') correctAnswerText = q.option_a;
  else if (q.correct_answer === 'B') correctAnswerText = q.option_b;
  else if (q.correct_answer === 'C') correctAnswerText = q.option_c;
  else if (q.correct_answer === 'D') correctAnswerText = q.option_d;

  return {
    id: q.id,
    category: q.categories?.name || 'Unknown',
    subcategory: '',
    difficulty: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3,
    question: q.question_text,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    correct: correctAnswerText,
    explanation: q.explanation || '',
    source: q.source_reference || '',
    source_type: q.source_type || 'official',
    tags: [],
  };
};