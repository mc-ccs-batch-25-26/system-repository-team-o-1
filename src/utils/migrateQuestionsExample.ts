

import { bulkCreateQuestions } from '../firebase/questionService';

interface JSONQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface JSONData {
  title: string;
  questions: JSONQuestion[];
}

/**
 * Migrate questions from a single JSON file to the database
 */
export async function migrateFromJSONFile(
  filename: string,
  category: string,
  defaultDifficulty: 'easy' | 'medium' | 'hard' = 'medium',
  examType: 'LET' | 'CSE' | 'CLE' = 'LET'
) {
  try {
    console.log(`Starting migration for ${filename}...`);

    // Fetch the JSON file
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }

    const data: JSONData = await response.json();
    console.log(`Loaded ${data.questions.length} questions from ${filename}`);

    // Transform JSON format to database format
    const questionsToInsert = data.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation || '',
      category: category,
      difficulty: defaultDifficulty,
      exam_type: examType,
    }));

    // Insert into database in batches (Supabase has limits)
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize);
      await bulkCreateQuestions(batch);
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${questionsToInsert.length} questions`);
    }

    console.log(` Successfully migrated ${inserted} questions from ${filename}`);
    return inserted;
  } catch (error) {
    console.error(` Error migrating ${filename}:`, error);
    throw error;
  }
}

/**
 * Migrate all JSON files to database
 */
export async function migrateAllJSONFiles(examType: 'LET' | 'CSE' | 'CLE' = 'LET') {
  const filesToMigrate = [
    { filename: 'genEd.json', category: 'genEd', examType },
    { filename: 'profEd.json', category: 'profEd', examType },
    { filename: 'afa.json', category: 'afa', examType },
    { filename: 'bioSci.json', category: 'bioSci', examType },
    { filename: 'english.json', category: 'english', examType },
    { filename: 'fil.json', category: 'fil', examType },
    { filename: 'math.json', category: 'math', examType },
    { filename: 'physics.json', category: 'physics', examType },
    { filename: 'chem.json', category: 'chem', examType },
    { filename: 'socsci.json', category: 'socsci', examType },
    { filename: 'values.json', category: 'values', examType },
    { filename: 'mapeh.json', category: 'mapeh', examType },
  ];

  let totalMigrated = 0;
  const results = [];

  for (const file of filesToMigrate) {
    try {
      const count = await migrateFromJSONFile(file.filename, file.category, 'medium', file.examType);
      totalMigrated += count;
      results.push({ ...file, success: true, count });
    } catch (error) {
      console.error(`Failed to migrate ${file.filename}:`, error);
      results.push({ ...file, success: false, error });
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total questions migrated: ${totalMigrated}`);
  console.log('\nDetails:');
  results.forEach((result) => {
    if (result.success && 'count' in result) {
      console.log(` ${result.filename}: ${result.count} questions`);
    } else {
      console.log(` ${result.filename}: Failed`);
    }
  });

  return { totalMigrated, results };
}


export async function dryRunMigration(filename: string) {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }

    const data: JSONData = await response.json();
    
    console.log(`\n=== Dry Run for ${filename} ===`);
    console.log(`Title: ${data.title}`);
    console.log(`Total questions: ${data.questions.length}`);
    
    // Sample first question
    if (data.questions.length > 0) {
      console.log('\nSample question:');
      console.log(JSON.stringify(data.questions[0], null, 2));
    }

    // Check for any issues
    const issues: string[] = [];
    data.questions.forEach((q, index) => {
      if (!q.question) issues.push(`Question ${index + 1}: Missing question text`);
      if (!q.options || q.options.length !== 4) {
        issues.push(`Question ${index + 1}: Must have exactly 4 options`);
      }
      if (!q.correctAnswer) {
        issues.push(`Question ${index + 1}: Missing correct answer`);
      }
      if (!q.options?.includes(q.correctAnswer)) {
        issues.push(`Question ${index + 1}: Correct answer not in options`);
      }
    });

    if (issues.length > 0) {
      console.log('\n Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\nNo issues found. Safe to migrate.');
    }

    return {
      filename,
      totalQuestions: data.questions.length,
      issues,
      canMigrate: issues.length === 0
    };
  } catch (error) {
    console.error(`Error in dry run for ${filename}:`, error);
    throw error;
  }
}


