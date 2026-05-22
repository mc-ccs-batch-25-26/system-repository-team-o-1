export interface LessonItem {
  id: string;
  word: string;
  definition: string;
  keyPoints: string[];
  simpleExplanation: string;
   difficulty?: string;
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
      // ── SYNONYMS (10 items) ──
      {
        id: 'v-synonyms',
        title: 'Synonyms',
        description: 'Learn words with similar meanings to improve your vocabulary and reading comprehension.',
        items: [
          { id: 'v-syn-1', word: 'Ameliorate', definition: 'To make something bad or unsatisfactory better.', keyPoints: ['Used when talking about improving a situation', 'Often relates to conditions, problems, or states', 'Synonyms: improve, enhance, better'], simpleExplanation: 'When you ameliorate something, you are fixing a bad situation and making it better.', example: 'The new policies were introduced to ameliorate the working conditions of the employees.' },
          { id: 'v-syn-2', word: 'Ephemeral', definition: 'Lasting for a very short time.', keyPoints: ['Refers to things that are temporary or fleeting', 'Often used in poetry or literature', 'Synonyms: fleeting, passing, brief'], simpleExplanation: 'Something ephemeral is here today and gone tomorrow.', example: 'Fame in the age of social media is often ephemeral.' },
          { id: 'v-syn-3', word: 'Cacophony', definition: 'A harsh, discordant mixture of sounds.', keyPoints: ['Always relates to sound/noise', 'Implies chaos and lack of harmony', 'Synonyms: noise, discord, racket'], simpleExplanation: 'A cacophony is just a really loud, confusing, and unpleasant noise.', example: 'A cacophony of alarms and sirens woke the neighborhood.' },
          { id: 'v-syn-4', word: 'Benevolent', definition: 'Well-meaning, generous, and kindly.', keyPoints: ['Describes a person or action that is charitable', 'Often used for leaders or organizations', 'Synonyms: kind, generous, altruistic'], simpleExplanation: 'A benevolent person genuinely wants to help others without expecting anything in return.', example: 'The benevolent donor funded scholarships for underprivileged students.' },
          { id: 'v-syn-5', word: 'Ubiquitous', definition: 'Present, appearing, or found everywhere.', keyPoints: ['Describes something extremely common', 'Can refer to physical items or abstract concepts', 'Synonyms: everywhere, pervasive, omnipresent'], simpleExplanation: 'If something is ubiquitous, you see it absolutely everywhere you go.', example: 'Smartphones have become ubiquitous in modern society.' },
          { id: 'v-syn-6', word: 'Pragmatic', definition: 'Dealing with things sensibly and realistically.', keyPoints: ['Focuses on practical results, not theories', 'A compliment for decision-makers', 'Synonyms: practical, realistic, sensible'], simpleExplanation: 'A pragmatic person cares about what actually works, not what sounds good in theory.', example: 'We need a pragmatic approach to solve the budget crisis.' },
          { id: 'v-syn-7', word: 'Meticulous', definition: 'Showing great attention to detail; very careful and precise.', keyPoints: ['Can describe a person or their work', 'Implies thoroughness, not speed', 'Synonyms: careful, precise, thorough'], simpleExplanation: 'A meticulous person double-checks everything and leaves nothing to chance.', example: 'The meticulous editor caught every typo in the 500-page manuscript.' },
          { id: 'v-syn-8', word: 'Exacerbate', definition: 'To make a problem, situation, or feeling worse.', keyPoints: ['Always used negatively', 'Often relates to conflicts or health', 'Synonyms: worsen, aggravate, intensify'], simpleExplanation: 'To exacerbate is to pour fuel on a fire that is already burning.', example: 'The heated argument only served to exacerbate the tension between the two teams.' },
          { id: 'v-syn-9', word: 'Resilient', definition: 'Able to withstand or recover quickly from difficult conditions.', keyPoints: ['Used for people, materials, or systems', 'Implies flexibility, not just strength', 'Synonyms: tough, flexible, durable'], simpleExplanation: 'A resilient person bounces back from failure stronger than before.', example: 'The resilient community rebuilt their homes within months after the typhoon.' },
          { id: 'v-syn-10', word: 'Verbose', definition: 'Using or expressed in more words than are needed.', keyPoints: ['Often used as criticism of writing or speech', 'Does NOT mean eloquent', 'Synonyms: wordy, long-winded, rambling'], simpleExplanation: 'A verbose speaker takes 100 words to say what could be said in 10.', example: 'The professor\'s verbose lecture could have been summarized in three bullet points.' },
        ],
        quizQuestions: [
          { id: 'q-v-syn-1', question: 'Which is the best synonym for "Ameliorate"?', options: ['Worsen', 'Improve', 'Maintain', 'Destroy'], correctAnswer: 'Improve' },
          { id: 'q-v-syn-2', question: 'If something is "Ephemeral", it is:', options: ['Permanent', 'Temporary', 'Beautiful', 'Dangerous'], correctAnswer: 'Temporary' },
          { id: 'q-v-syn-3', question: 'What is a synonym for "Cacophony"?', options: ['Harmony', 'Silence', 'Discord', 'Melody'], correctAnswer: 'Discord' },
          { id: 'q-v-syn-4', question: 'A "Benevolent" person is:', options: ['Cruel', 'Kind', 'Lazy', 'Greedy'], correctAnswer: 'Kind' },
          { id: 'q-v-syn-5', question: '"Ubiquitous" most nearly means:', options: ['Rare', 'Everywhere', 'Hidden', 'Expensive'], correctAnswer: 'Everywhere' },
        ],
      },

      // ── ANTONYMS (10 items) ──
      {
        id: 'v-antonyms',
        title: 'Antonyms',
        description: 'Understand words with opposite meanings to expand your contrastive vocabulary.',
        items: [
          { id: 'v-ant-1', word: 'Generous vs. Stingy', definition: 'Generous means willing to give freely; stingy means unwilling to share.', keyPoints: ['Generous = giving', 'Stingy = withholding', 'Context matters — financial, emotional, or time'], simpleExplanation: 'A generous person shares openly; a stingy person holds back everything.', example: 'While Maria is generous with her time, volunteering every weekend, her brother is stingy and refuses to help anyone.' },
          { id: 'v-ant-2', word: 'Transparent vs. Opaque', definition: 'Transparent means clear/see-through; opaque means not able to be seen through.', keyPoints: ['Can be literal (glass vs. brick) or figurative (honest vs. secretive)', 'Transparent = open, clear', 'Opaque = hidden, unclear'], simpleExplanation: 'A transparent glass lets light through; an opaque wall does not. In business, transparent means honest and open.', example: 'The government promised transparent budgeting, but their actual process remained opaque.' },
          { id: 'v-ant-3', word: 'Authentic vs. Counterfeit', definition: 'Authentic means genuine and real; counterfeit means fake or imitation.', keyPoints: ['Authentic = real, original', 'Counterfeit = fake, forged', 'Often used for documents, products, or emotions'], simpleExplanation: 'An authentic Rolex comes from the factory; a counterfeit one comes from a street vendor.', example: 'The museum confirmed the painting was authentic, not a counterfeit copy.' },
          { id: 'v-ant-4', word: 'Abundant vs. Scarce', definition: 'Abundant means existing in large quantities; scarce means in short supply.', keyPoints: ['Abundant = plentiful, more than enough', 'Scarce = limited, hard to find', 'Both are often used in economics and nature'], simpleExplanation: 'When something is abundant, there is plenty for everyone. When scarce, people compete for it.', example: 'Fresh water is abundant in the tropics but scarce in desert regions.' },
          { id: 'v-ant-5', word: 'Brave vs. Cowardly', definition: 'Brave means ready to face danger; cowardly means lacking courage.', keyPoints: ['Brave = courageous, fearless', 'Cowardly = fearful, timid', 'Both describe responses to fear or danger'], simpleExplanation: 'A brave person acts despite fear; a cowardly person runs away from it.', example: 'The brave firefighter rushed into the building while the cowardly bystander only recorded the incident.' },
          { id: 'v-ant-6', word: 'Hostile vs. Friendly', definition: 'Hostile means unfriendly or antagonistic; friendly means kind and pleasant.', keyPoints: ['Hostile = aggressive, unwelcoming', 'Friendly = warm, welcoming', 'Can describe environments, people, or attitudes'], simpleExplanation: 'A hostile reception makes you want to leave; a friendly one makes you want to stay.', example: 'The hostile work environment drove employees away; the new manager created a friendly, collaborative culture.' },
          { id: 'v-ant-7', word: 'Loathe vs. Adore', definition: 'Loathe means to feel intense dislike; adore means to love deeply.', keyPoints: ['Loathe = hate, despise', 'Adore = love, cherish', 'Both express strong emotions'], simpleExplanation: 'You loathe what you cannot stand; you adore what you cannot live without.', example: 'She loathes cold weather but adores the warmth of summer.' },
          { id: 'v-ant-8', word: 'Permanent vs. Temporary', definition: 'Permanent means lasting forever; temporary means lasting for a limited time.', keyPoints: ['Permanent = everlasting, fixed', 'Temporary = short-term, interim', 'Used for jobs, solutions, conditions'], simpleExplanation: 'A permanent solution fixes the problem for good; a temporary one only patches it.', example: 'The company offered her a permanent position after her temporary contract ended.' },
          { id: 'v-ant-9', word: 'Optimistic vs. Pessimistic', definition: 'Optimistic means hopeful about the future; pessimistic means expecting the worst.', keyPoints: ['Optimistic = positive, hopeful', 'Pessimistic = negative, doubtful', 'Both describe outlooks or attitudes'], simpleExplanation: 'An optimistic person sees the glass half-full; a pessimistic person sees it half-empty.', example: 'Despite the challenges, she remained optimistic while her colleague stayed pessimistic.' },
          { id: 'v-ant-10', word: 'Expand vs. Contract', definition: 'Expand means to become larger; contract means to become smaller.', keyPoints: ['Expand = grow, enlarge', 'Contract = shrink, reduce', 'Used in physics, business, and writing'], simpleExplanation: 'Things expand when heated and contract when cooled — physically and metaphorically.', example: 'The company plans to expand into Asia while contracting its European operations.' },
        ],
        quizQuestions: [
          { id: 'q-v-ant-1', question: 'The opposite of "Generous" is:', options: ['Kind', 'Stingy', 'Rich', 'Charitable'], correctAnswer: 'Stingy' },
          { id: 'q-v-ant-2', question: 'If glass is transparent, brick is:', options: ['Heavy', 'Opaque', 'Clear', 'Fragile'], correctAnswer: 'Opaque' },
          { id: 'q-v-ant-3', question: 'The antonym of "Abundant" is:', options: ['Plentiful', 'Scarce', 'Common', 'Frequent'], correctAnswer: 'Scarce' },
          { id: 'q-v-ant-4', question: '"Loathe" is the opposite of:', options: ['Hate', 'Adore', 'Ignore', 'Fear'], correctAnswer: 'Adore' },
          { id: 'q-v-ant-5', question: 'A "Permanent" job is the opposite of a ___ job:', options: ['Full-time', 'Temporary', 'Well-paying', 'Difficult'], correctAnswer: 'Temporary' },
        ],
      },

      // ── CORRECT GRAMMAR USAGE (10 items) ──
      {
        id: 'v-grammar',
        title: 'Correct Grammar Usage',
        description: 'Master the rules of English grammar for written and spoken communication.',
        items: [
          { id: 'v-gr-1', word: 'Subject-Verb Agreement', definition: 'The subject and verb must agree in number — singular subjects take singular verbs; plural subjects take plural verbs.', keyPoints: ['Singular: The dog barks', 'Plural: The dogs bark', 'Ignore prepositional phrases between subject and verb'], simpleExplanation: 'Match the verb to who or what is doing the action — one barks, many bark.', example: 'The box of chocolates IS on the table. (Box is singular, despite "chocolates" being plural.)' },
          { id: 'v-gr-2', word: 'Pronoun-Antecedent Agreement', definition: 'A pronoun must agree in number and gender with the noun it replaces.', keyPoints: ['Each student must submit HIS or HER paper (formal)', 'All students must submit THEIR papers (plural)', 'Singular "they" is increasingly accepted for gender neutrality'], simpleExplanation: 'The pronoun should match the word it refers to — one person = he/she, multiple people = they.', example: 'Every employee should bring his or her ID. OR All employees should bring their IDs.' },
          { id: 'v-gr-3', word: 'Who vs. Whom', definition: 'Who is used as the subject; whom is used as the object of a verb or preposition.', keyPoints: ['Who = he/she (subject)', 'Whom = him/her (object)', 'After prepositions, always use whom'], simpleExplanation: 'If you can replace it with "he," use who. If you can replace it with "him," use whom.', example: 'WHO called? (He called.) TO WHOM did you give the book? (I gave it to him.)' },
          { id: 'v-gr-4', word: 'Lie vs. Lay', definition: 'Lie means to recline (no object needed); lay means to put something down (requires an object).', keyPoints: ['Lie = recline (I lie down)', 'Lay = place (I lay the book down)', 'Past tense: lie→lay, lay→laid'], simpleExplanation: 'You lie down yourself. You lay something else down.', example: 'I need to LIE down. Please LAY the papers on my desk.' },
          { id: 'v-gr-5', word: 'Its vs. It\'s', definition: 'Its is possessive; it\'s is the contraction of "it is" or "it has."', keyPoints: ['Its = belonging to it', 'It\'s = it is / it has', 'No apostrophe in possessive its'], simpleExplanation: 'If you can replace it with "it is," use the apostrophe. Otherwise, don\'t.', example: 'The company lost ITS license. IT\'S a shame that happened.' },
          { id: 'v-gr-6', word: 'Fewer vs. Less', definition: 'Fewer is used for countable items; less is used for uncountable quantities.', keyPoints: ['Fewer = things you can count (fewer apples)', 'Less = things you measure (less water)', 'Common error: "10 items or less" should be "10 items or fewer"'], simpleExplanation: 'If you can count them one by one, use fewer. If it\'s a mass, use less.', example: 'There are FEWER students this year. We have LESS time than expected.' },
          { id: 'v-gr-7', word: 'Parallel Structure', definition: 'Items in a list or series must use the same grammatical form.', keyPoints: ['All items must match: nouns, verbs, or phrases', 'Bad: She likes swimming, to run, and biking', 'Good: She likes swimming, running, and biking'], simpleExplanation: 'Everything in a list should be in the same form — all -ing, all to-, or all nouns.', example: 'The job requires analyzing data, writing reports, and managing teams.' },
          { id: 'v-gr-8', word: 'Dangling Modifiers', definition: 'A modifier must clearly refer to the word it modifies; if the subject is missing, the modifier dangles.', keyPoints: ['Modifier should be next to the word it describes', 'Bad: Walking down the street, the trees were beautiful', 'Good: Walking down the street, I saw beautiful trees'], simpleExplanation: 'Make sure the describing phrase clearly points to who or what is doing the action.', example: 'WRONG: After studying for hours, the exam seemed easy. RIGHT: After studying for hours, I found the exam easy.' },
          { id: 'v-gr-9', word: 'Subjunctive Mood', definition: 'Used for wishes, hypotheticals, and demands — typically uses "were" instead of "was."', keyPoints: ['If I WERE you (not was)', 'I wish it WERE true', 'The committee demands that she BE present'], simpleExplanation: 'Use "were" for things that are contrary to fact — things that aren\'t true but you wish they were.', example: 'If I WERE a millionaire, I would travel the world. (I am not a millionaire.)' },
          { id: 'v-gr-10', word: 'Affect vs. Effect', definition: 'Affect is usually a verb meaning to influence; effect is usually a noun meaning a result.', keyPoints: ['Affect = action (verb) — "It affected me"', 'Effect = result (noun) — "The effect was huge"', 'Rare: effect as verb means "to bring about"'], simpleExplanation: 'Affect is the action; effect is the outcome. A for action, E for end result.', example: 'The new law AFFECTED thousands. The EFFECT of the law was immediate.' },
        ],
        quizQuestions: [
          { id: 'q-v-gr-1', question: 'Choose the correct: The team ___ playing well.', options: ['are', 'is', 'were', 'have'], correctAnswer: 'is' },
          { id: 'q-v-gr-2', question: '___ did you invite to the party?', options: ['Who', 'Whom', 'Whose', 'Which'], correctAnswer: 'Whom' },
          { id: 'q-v-gr-3', question: 'I need to ___ down for a while.', options: ['lay', 'lie', 'laid', 'lain'], correctAnswer: 'lie' },
          { id: 'q-v-gr-4', question: '___ going to rain today.', options: ['Its', 'It\'s', 'Its\'', 'It'], correctAnswer: 'It\'s' },
          { id: 'q-v-gr-5', question: 'There are ___ cookies in the jar today.', options: ['less', 'fewer', 'little', 'much'], correctAnswer: 'fewer' },
        ],
      },

      // ── REMAINING TOPICS (empty — ready for expansion) ──
      { id: 'v-error', title: 'Error Recognition', description: 'Identify common grammatical and structural errors in sentences.', items: [], quizQuestions: [] },
      { id: 'v-sentence', title: 'Sentence Structure', description: 'Learn how to construct clear, concise, and logical sentences.', items: [], quizQuestions: [] },
      { id: 'v-reading', title: 'Reading Comprehension', description: 'Develop skills to quickly understand, analyze, and interpret written passages.', items: [], quizQuestions: [] },
    ],
  },

  // ── NUMERICAL ABILITY ──
  {
    id: 'quant',
    title: 'Numerical Ability',
    topics: [
      {
        id: 'q-arithmetic',
        title: 'Basic Arithmetic',
        description: 'Review fundamental mathematical operations.',
        items: [
          { id: 'q-arith-1', word: 'Order of Operations (PEMDAS)', definition: 'The rule that defines the correct sequence for evaluating a math expression.', keyPoints: ['Parentheses first', 'Exponents second', 'Multiplication/Division (left to right)', 'Addition/Subtraction (left to right)'], simpleExplanation: 'PEMDAS tells you what to calculate first so everyone gets the same answer.', example: '3 + 4 × 2 = 3 + 8 = 11 (multiply first, then add)' },
          { id: 'q-arith-2', word: 'Greatest Common Divisor (GCD)', definition: 'The largest number that divides two or more numbers without a remainder.', keyPoints: ['Find all factors of each number', 'Identify the largest common factor', 'Useful for simplifying fractions'], simpleExplanation: 'The GCD is the biggest number that can divide both numbers evenly.', example: 'GCD of 24 and 36 is 12. (24÷12=2, 36÷12=3)' },
          { id: 'q-arith-3', word: 'Least Common Multiple (LCM)', definition: 'The smallest number that is a multiple of two or more numbers.', keyPoints: ['List multiples of each number', 'Find the smallest common one', 'Useful for adding fractions with different denominators'], simpleExplanation: 'The LCM is the smallest number both original numbers can divide into evenly.', example: 'LCM of 6 and 8 is 24. (6×4=24, 8×3=24)' },
          { id: 'q-arith-4', word: 'Fractions to Decimals', definition: 'Any fraction can be converted to a decimal by dividing the numerator by the denominator.', keyPoints: ['Divide top by bottom', '1/4 = 0.25', 'Repeating decimals: 1/3 = 0.333...'], simpleExplanation: 'The fraction bar is just a division sign — divide the top number by the bottom number.', example: '3/8 = 3 ÷ 8 = 0.375' },
          { id: 'q-arith-5', word: 'Percentage Basics', definition: 'A percentage represents a number out of 100.', keyPoints: ['"Percent" = per hundred', 'To find X% of Y: multiply Y by X/100', 'Percentage change: (new - old)/old × 100'], simpleExplanation: 'Percentages make comparisons easier by putting everything on a scale of 0 to 100.', example: '25% of 200 = 200 × 25/100 = 50' },
        ],
        quizQuestions: [
          { id: 'q-qa-1', question: 'What is 3 + 4 × 2?', options: ['14', '11', '10', '13'], correctAnswer: '11' },
          { id: 'q-qa-2', question: 'GCD of 24 and 36 is:', options: ['6', '12', '8', '4'], correctAnswer: '12' },
          { id: 'q-qa-3', question: 'LCM of 6 and 8 is:', options: ['12', '24', '48', '16'], correctAnswer: '24' },
          { id: 'q-qa-4', question: '3/8 as a decimal is:', options: ['0.3', '0.375', '0.38', '0.325'], correctAnswer: '0.375' },
          { id: 'q-qa-5', question: '25% of 200 is:', options: ['25', '50', '75', '100'], correctAnswer: '50' },
        ],
      },
      { id: 'q-percentages', title: 'Percentages', description: 'Learn how to calculate and apply percentages in real-world scenarios.', items: [], quizQuestions: [] },
      { id: 'q-algebra', title: 'Algebra', description: 'Understand variables, equations, and algebraic expressions.', items: [], quizQuestions: [] },
      { id: 'q-geometry', title: 'Geometry', description: 'Study shapes, sizes, and properties of space.', items: [], quizQuestions: [] },
      { id: 'q-data', title: 'Data Interpretation', description: 'Analyze charts, graphs, and tables.', items: [], quizQuestions: [] },
      { id: 'q-word', title: 'Word Problems', description: 'Translate real-world scenarios into mathematical equations.', items: [], quizQuestions: [] },
    ],
  },

  // ── ANALYTICAL ABILITY ──
  {
    id: 'logic',
    title: 'Analytical Ability',
    topics: [
      {
        id: 'l-analogies',
        title: 'Analogies',
        description: 'Identify relationships between pairs of concepts.',
        items: [
          { id: 'l-ana-1', word: 'Part-to-Whole', definition: 'One word is a component of the other.', keyPoints: ['A is a piece of B', 'Finger : Hand :: Toe : Foot', 'Ask: "Is A part of B?"'], simpleExplanation: 'If the first pair is a piece of something and the whole thing, the answer must match that pattern.', example: 'Leaf : Tree :: Petal : Flower' },
          { id: 'l-ana-2', word: 'Worker-Workplace', definition: 'The relationship between a professional and where they work.', keyPoints: ['Doctor : Hospital :: Teacher : School', 'A works in/at B', 'Check both pairs for the same setting'], simpleExplanation: 'The first word is the person, the second is where they do their job.', example: 'Chef : Kitchen :: Pilot : Cockpit' },
          { id: 'l-ana-3', word: 'Tool-Function', definition: 'The relationship between an object and what it does.', keyPoints: ['Pen : Write :: Knife : Cut', 'A is used to B', 'The function must be the primary purpose'], simpleExplanation: 'What does the first thing do? The second word should be that action.', example: 'Scissors : Cut :: Glue : Adhere' },
          { id: 'l-ana-4', word: 'Cause-Effect', definition: 'One word causes or leads to the other.', keyPoints: ['Rain : Flood :: Exercise : Fitness', 'A leads to B', 'Must be a direct causal relationship'], simpleExplanation: 'If the first thing happens, the second thing follows as a result.', example: 'Study : Knowledge :: Practice : Skill' },
          { id: 'l-ana-5', word: 'Synonym/Antonym Analogy', definition: 'The relationship between the pair is one of similar or opposite meaning.', keyPoints: ['Happy : Joyful :: Sad : Depressed (synonyms)', 'Hot : Cold :: Up : Down (antonyms)', 'Identify the relationship type first'], simpleExplanation: 'Both pairs share the same kind of meaning relationship — both are synonyms, or both are antonyms.', example: 'Brave : Cowardly :: Generous : Stingy (both are antonyms)' },
        ],
        quizQuestions: [
          { id: 'q-la-1', question: 'Wheel : Car :: Keyboard : ?', options: ['Monitor', 'Computer', 'Typing', 'Mouse'], correctAnswer: 'Computer' },
          { id: 'q-la-2', question: 'Doctor : Hospital :: Teacher : ?', options: ['Student', 'School', 'Book', 'Lesson'], correctAnswer: 'School' },
          { id: 'q-la-3', question: 'Pen : Write :: Knife : ?', options: ['Sharp', 'Cut', 'Blade', 'Kitchen'], correctAnswer: 'Cut' },
          { id: 'q-la-4', question: 'Rain : Flood :: Study : ?', options: ['Book', 'School', 'Knowledge', 'Test'], correctAnswer: 'Knowledge' },
          { id: 'q-la-5', question: 'Hot : Cold :: Brave : ?', options: ['Heroic', 'Cowardly', 'Strong', 'Fearful'], correctAnswer: 'Cowardly' },
        ],
      },
      { id: 'l-deductive', title: 'Deductive Reasoning', description: 'Draw specific conclusions from general premises.', items: [], quizQuestions: [] },
      { id: 'l-sequences', title: 'Sequences & Patterns', description: 'Identify the rule governing a series of numbers or letters.', items: [], quizQuestions: [] },
      { id: 'l-syllogisms', title: 'Syllogisms', description: 'Evaluate logical arguments with two premises and a conclusion.', items: [], quizQuestions: [] },
      { id: 'l-pattern', title: 'Pattern Recognition', description: 'Spot visual or conceptual patterns in information.', items: [], quizQuestions: [] },
      { id: 'l-critical', title: 'Critical Analysis', description: 'Evaluate arguments, identify assumptions, and find flaws.', items: [], quizQuestions: [] },
    ],
  },
  
  // ── GENERAL INFORMATION ──
  {
    id: 'gen-info',
    title: 'General Information',
    topics: [
      { id: 'g-constitution', title: 'Philippine Constitution', description: 'Study the fundamental law of the land.', items: [], quizQuestions: [] },
      { id: 'g-ethics', title: 'RA 6713', description: 'Code of Conduct and Ethical Standards for Public Officials.', items: [], quizQuestions: [] },
      { id: 'g-environment', title: 'Environmental Laws', description: 'Learn about major environmental protections in the PH.', items: [], quizQuestions: [] },
      { id: 'g-current', title: 'Current Events', description: 'Stay updated on national issues and government programs.', items: [], quizQuestions: [] },
    ],
  },
];