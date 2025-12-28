import { createClient } from '@supabase/supabase-js';
import { createMockUser } from '../factories/user.factory';

export const createTestSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export const cleanupTestData = async (userId: string) => {
  const supabase = createTestSupabaseClient();

  await supabase.from('user_badges').delete().eq('user_id', userId);
  await supabase.from('game_sessions').delete().eq('user_id', userId);
  await supabase.from('users').delete().eq('id', userId);
};

export const seedTestUser = async (userData = {}) => {
  const supabase = createTestSupabaseClient();
  const user = createMockUser(userData);

  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const seedTestUsers = async (count: number) => {
  const supabase = createTestSupabaseClient();
  const users = Array(count).fill(null).map(() => createMockUser());

  const { data, error } = await supabase
    .from('users')
    .insert(users)
    .select();

  if (error) throw error;
  return data;
};
