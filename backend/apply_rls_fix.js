const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
);

async function applyFix() {
  console.log('Applying RLS fix...\n');
  
  // Drop the problematic policies
  console.log('1. Dropping problematic policies...');
  await supabase.rpc('exec_sql', { query: 'DROP POLICY IF EXISTS "Admins can view all users" ON users' });
  await supabase.rpc('exec_sql', { query: 'DROP FUNCTION IF EXISTS is_admin()' });
  
  // Create the SECURITY DEFINER function
  console.log('2. Creating helper function...');
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION auth.is_admin_user()
    RETURNS BOOLEAN AS $$
    DECLARE
      user_role TEXT;
    BEGIN
      SELECT role INTO user_role 
      FROM public.users 
      WHERE id = auth.uid()
      LIMIT 1;
      
      RETURN COALESCE(user_role = 'admin', FALSE);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  const { error: funcError } = await supabase.rpc('exec_sql', { query: createFunctionSQL });
  if (funcError) console.error('Function error:', funcError);
  
  // Recreate the policy
  console.log('3. Creating new policy...');
  const createPolicySQL = `
    CREATE POLICY "Admins can view all users" ON users
      FOR SELECT
      USING (auth.is_admin_user());
  `;
  
  const { error: policyError } = await supabase.rpc('exec_sql', { query: createPolicySQL });
  if (policyError) console.error('Policy error:', policyError);
  
  console.log('\n✓ RLS fix applied successfully!');
}

applyFix().then(() => process.exit(0)).catch(e => {
  console.error('Fix failed:', e);
  process.exit(1);
});
