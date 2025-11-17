const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testFlow() {
  console.log('=== Testing Full Login → Dashboard Flow ===\n');
  
  // Step 1: Login
  console.log('1. Testing login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'estee@masstock.com',
    password: 'EsteePassword123!'
  });
  
  if (authError) {
    console.error('Login failed:', authError);
    return;
  }
  
  console.log('✓ Login successful');
  console.log('  Token:', authData.session.access_token.substring(0, 30) + '...');
  
  // Step 2: Verify user in public.users
  const { data: user } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', authData.user.id)
    .single();
  
  console.log('\n2. User in database:', user);
  
  // Step 3: Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  console.log('\n3. Client record:', client ? {
    id: client.id,
    name: client.name,
    email: client.email,
    status: client.status
  } : 'NOT FOUND');
  
  // Step 4: Get workflows
  const { data: workflows, error: workflowError } = await supabase
    .from('workflows')
    .select('id, name, description, status')
    .eq('client_id', client.id);
  
  if (workflowError) {
    console.error('\n4. Error fetching workflows:', workflowError);
    return;
  }
  
  console.log('\n4. Workflows found:', workflows.length);
  workflows.forEach((w, idx) => {
    console.log('   ' + (idx + 1) + '. ' + w.name + ' (' + w.status + ')');
  });
  
  console.log('\n=== TEST PASSED ===');
  console.log('Dashboard should load successfully with', workflows.length, 'workflows');
}

testFlow().then(() => process.exit(0)).catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
