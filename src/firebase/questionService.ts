import { supabase } from '../supabase/supabaseClient';

// Types
export interface Question {
  id: string;
  category_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  source_reference?: string;
  source_type?: string;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_verified_at?: string;      
  verified_by?: string; 
  categories?: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
}

// ==================== QUESTIONS ====================

export const fetchQuestionById = async (id: string): Promise<Question | null> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*, categories(id, name, icon)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createQuestion = async (question: Partial<Question>): Promise<Question> => {
  const { data, error } = await supabase
    .from('questions')
    .insert([question])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateQuestion = async (id: string, updates: Partial<Question>): Promise<Question> => {
  const { data, error } = await supabase
    .from('questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
};

export const hardDeleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const verifyQuestion = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .update({ 
      verified_by: userId, 
      last_verified_at: new Date().toISOString() 
    })
    .eq('id', id);
  
  if (error) throw error;
};

// ==================== CATEGORIES ====================

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createCategory = async (category: Partial<Category>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ==================== QUIZ GENERATION ====================

export const fetchQuizQuestions = async (
  categoryIds: string[],
  count: number = 10,
  difficulty?: string
): Promise<Question[]> => {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .in('category_id', categoryIds)
    .limit(count);

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];
  return shuffled.slice(0, count);
};

// Get all category IDs
export const getCategoryIds = async (): Promise<string[]> => {
  const { data } = await supabase.from('categories').select('id');
  return data?.map(c => c.id) || [];
};

// Get category IDs by names
export const getCategoryIdsByNames = async (names: string[]): Promise<string[]> => {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .in('name', names);
  return data?.map(c => c.id) || [];
};

export const fetchQuestions = async (filters?: {
  categoryId?: string;
  difficulty?: string;
  searchTerm?: string;
  limit?: number;
}): Promise<Question[]> => {
  let query = supabase
    .from('questions')
    .select('*, categories(id, name, icon)')
    .eq('is_active', true);

  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters?.searchTerm) query = query.ilike('question_text', `%${filters.searchTerm}%`);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};