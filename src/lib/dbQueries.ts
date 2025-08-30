import { supabase } from './supabaseClient';

// Insert a saved search for a user
export async function saveSearch(userId: string, params: object) {
  const { error } = await supabase
    .from('saved_searches')
    .insert([{ user_id: userId, params }]);
  return error;
}

// Fetch saved searches for a user
export async function getSavedSearches(userId: string) {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

// Delete a saved search by id
export async function deleteSavedSearch(id: string) {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id);
  return error;
}