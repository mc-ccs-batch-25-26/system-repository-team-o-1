export interface LessonItem {
  id: string;
  word: string;
  definition: string;
  keyPoints: string[];
  simpleExplanation: string;
  example: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  items: LessonItem[];
  quizQuestions: QuizQuestion[];
}

export interface Category {
  id: string;
  title: string;
  topics: Topic[];
}

export const lessonContent: Category[] = [
  {
    id: 'verbal',
    title: 'Verbal Ability',
    topics: [
      {
        id: 'v-synonyms',
        title: 'Synonyms',
        description: 'Learn words with similar meanings to improve your vocabulary and reading comprehension.',
        items: [
          {
            id: 'v-syn-1',
            word: 'Ameliorate',
            definition: 'To make something bad or unsatisfactory better.',
            keyPoints: [
              'Used when talking about improving a situation',
              'Often relates to conditions, problems, or states',
              'Synonyms include: improve, enhance, better'
            ],
            simpleExplanation: 'When you ameliorate something, you are fixing a bad situation and making it better.',
            example: 'The new policies were introduced to ameliorate the working conditions of the employees.'
          },
          {
            id: 'v-syn-2',
            word: 'Ephemeral',
            definition: 'Lasting for a very short time.',
            keyPoints: [
              'Refers to things that are temporary or fleeting',
              'Often used in poetry or literature',
              'Synonyms include: fleeting, passing, brief'
            ],
            simpleExplanation: 'Something ephemeral is here today and gone tomorrow.',
            example: 'Fame in the age of social media is often ephemeral.'
          },
          {
            id: 'v-syn-3',
            word: 'Cacophony',
            definition: 'A harsh, discordant mixture of sounds.',
            keyPoints: [
              'Always relates to sound/noise',
              'Implies chaos and lack of harmony',
              'Synonyms include: noise, discord, racket'
            ],
            simpleExplanation: 'A cacophony is just a really loud, confusing, and unpleasant noise.',
            example: 'A cacophony of alarms and sirens woke the neighborhood.'
          }
        ],
        quizQuestions: [
          {
            id: 'q-v-syn-1',
            question: 'Which of the following is the best synonym for "Ameliorate"?',
            options: ['Worsen', 'Improve', 'Maintain', 'Destroy'],
            correctAnswer: 'Improve'
          },
          {
            id: 'q-v-syn-2',
            question: 'If something is described as "Ephemeral", it is:',
            options: ['Permanent', 'Temporary', 'Beautiful', 'Dangerous'],
            correctAnswer: 'Temporary'
          },
          {
            id: 'q-v-syn-3',
            question: 'What is a synonym for "Cacophony"?',
            options: ['Harmony', 'Silence', 'Discord', 'Melody'],
            correctAnswer: 'Discord'
          }
        ]
      },
      {
        id: 'v-antonyms',
        title: 'Antonyms',
        description: 'Understand words with opposite meanings to expand your contrastive vocabulary.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'v-grammar',
        title: 'Correct Grammar Usage',
        description: 'Master the rules of English grammar for written and spoken communication.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'v-error',
        title: 'Error Recognition',
        description: 'Identify common grammatical and structural errors in sentences.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'v-sentence',
        title: 'Sentence Structure',
        description: 'Learn how to construct clear, concise, and logical sentences.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'v-reading',
        title: 'Reading Comprehension',
        description: 'Develop skills to quickly understand, analyze, and interpret written passages.',
        items: [],
        quizQuestions: []
      }
    ]
  },
  {
    id: 'quant',
    title: 'Quantitative Ability',
    topics: [
      {
        id: 'q-arithmetic',
        title: 'Basic Arithmetic',
        description: 'Review fundamental mathematical operations including addition, subtraction, multiplication, and division.',
        items: [
          {
            id: 'q-arith-1',
            word: 'Order of Operations (PEMDAS)',
            definition: 'The rule that defines the correct sequence of steps for evaluating a math expression.',
            keyPoints: [
              'Parentheses first',
              'Exponents second',
              'Multiplication and Division (left to right)',
              'Addition and Subtraction (left to right)'
            ],
            simpleExplanation: 'PEMDAS tells you what part of a math problem to calculate first so everyone gets the same answer.',
            example: 'In the equation 3 + 4 × 2, you multiply first (4 × 2 = 8), then add 3 to get 11.'
          }
        ],
        quizQuestions: [
          {
            id: 'q-qa-1',
            question: 'According to PEMDAS, what is the value of 5 + 2 × 3?',
            options: ['21', '11', '10', '15'],
            correctAnswer: '11'
          }
        ]
      },
      {
        id: 'q-percentages',
        title: 'Percentages',
        description: 'Learn how to calculate and apply percentages in real-world scenarios.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'q-algebra',
        title: 'Algebra',
        description: 'Understand variables, equations, and algebraic expressions.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'q-geometry',
        title: 'Geometry',
        description: 'Study shapes, sizes, relative positions of figures, and properties of space.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'q-data',
        title: 'Data Interpretation',
        description: 'Analyze charts, graphs, and tables to extract meaningful information.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'q-word',
        title: 'Word Problems',
        description: 'Translate real-world scenarios into mathematical equations.',
        items: [],
        quizQuestions: []
      }
    ]
  },
  {
    id: 'logic',
    title: 'Logical Reasoning',
    topics: [
      {
        id: 'l-analogies',
        title: 'Analogies',
        description: 'Identify relationships between pairs of concepts to solve logical puzzles.',
        items: [
          {
            id: 'l-ana-1',
            word: 'Part-to-Whole Analogy',
            definition: 'A relationship where one word is a part of the other word.',
            keyPoints: [
              'Look for structural relationships',
              'Determine if A makes up B',
              'Apply the exact same relationship to the options'
            ],
            simpleExplanation: 'If the first pair is a piece of something and the whole thing, the answer must match that pattern.',
            example: 'Leaf is to Tree as Petal is to Flower.'
          }
        ],
        quizQuestions: [
          {
            id: 'q-la-1',
            question: 'Wheel is to Car as Keyboard is to:',
            options: ['Monitor', 'Computer', 'Typing', 'Mouse'],
            correctAnswer: 'Computer'
          }
        ]
      },
      {
        id: 'l-deductive',
        title: 'Deductive Reasoning',
        description: 'Draw specific conclusions from general premises or statements.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'l-sequences',
        title: 'Sequences & Patterns',
        description: 'Identify the rule governing a series of numbers or letters.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'l-syllogisms',
        title: 'Syllogisms',
        description: 'Evaluate logical arguments consisting of two premises and a conclusion.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'l-pattern',
        title: 'Pattern Recognition',
        description: 'Spot visual or conceptual patterns in complex information.',
        items: [],
        quizQuestions: []
      },
      {
        id: 'l-critical',
        title: 'Critical Analysis',
        description: 'Evaluate arguments, identify assumptions, and determine logical flaws.',
        items: [],
        quizQuestions: []
      }
    ]
  }
];
