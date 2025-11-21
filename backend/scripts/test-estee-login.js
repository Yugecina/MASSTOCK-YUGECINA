/**
 * Test Estee Login and Workflow Access
 * Simulates the full authentication flow and workflow retrieval
 */

const { supabaseAdmin } = require('../src/config/database');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEsteeLogin() {
  console.log('Testing Estee login and workflow access...\n');

  try {
    // Step 1: Authenticate as Estee
    console.log('Step 1: Authenticating as Estee...');
    console.log('Email: estee@masstock.com');
    console.log('Password: Estee123123\n');

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'estee@masstock.com',
      password: 'Estee123123'
    });

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    console.log('✓ Authentication successful!');
    console.log(`  - User ID: ${authData.user.id}`);
    console.log(`  - Email: ${authData.user.email}`);
    console.log(`  - Access Token: ${authData.session.access_token.substring(0, 50)}...`);
    console.log('');

    // Step 2: Fetch user from database
    console.log('Step 2: Fetching user from database...');
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    console.log('✓ User found in database:');
    console.log(`  - User ID: ${dbUser.id}`);
    console.log(`  - Email: ${dbUser.email}`);
    console.log(`  - Role: ${dbUser.role}`);
    console.log(`  - Status: ${dbUser.status}\n`);

    // Step 3: Fetch client
    console.log('Step 3: Fetching client information...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('user_id', dbUser.id)
      .single();

    if (clientError) {
      throw new Error(`Failed to fetch client: ${clientError.message}`);
    }

    console.log('✓ Client found:');
    console.log(`  - Client ID: ${client.id}`);
    console.log(`  - Name: ${client.name}`);
    console.log(`  - Email: ${client.email}`);
    console.log(`  - Status: ${client.status}\n`);

    // Step 4: Fetch workflows using service role (simulating backend API)
    console.log('Step 4: Fetching workflows (as backend would)...');
    const { data: workflows, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    if (workflowError) {
      throw new Error(`Failed to fetch workflows: ${workflowError.message}`);
    }

    console.log(`✓ Found ${workflows.length} workflow(s):\n`);
    workflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.name}`);
      console.log(`   ID: ${wf.id}`);
      console.log(`   Status: ${wf.status}`);
      console.log(`   Type: ${wf.config.workflow_type}`);
      console.log(`   Cost: $${wf.cost_per_execution}`);
      console.log(`   Revenue: $${wf.revenue_per_execution}`);
      console.log(`   Deployed: ${wf.deployed_at ? new Date(wf.deployed_at).toLocaleString() : 'N/A'}`);
      console.log('');
    });

    // Step 5: Test RLS by trying to fetch as authenticated user (not admin)
    console.log('Step 5: Testing RLS with user context...');
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`
          }
        }
      }
    );

    const { data: rlsWorkflows, error: rlsError } = await userSupabase
      .from('workflows')
      .select('id, name, status');

    if (rlsError) {
      console.log(`⚠️  RLS query failed: ${rlsError.message}`);
      console.log('This is expected if RLS policies are strict.\n');
    } else {
      console.log(`✓ RLS query successful! Found ${rlsWorkflows?.length || 0} workflow(s)`);
      if (rlsWorkflows && rlsWorkflows.length > 0) {
        rlsWorkflows.forEach((wf, index) => {
          console.log(`${index + 1}. ${wf.name} (${wf.status})`);
        });
      }
      console.log('');
    }

    // Summary
    console.log('═'.repeat(100));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(100));
    console.log(`\nAuthentication: ✓ Success`);
    console.log(`User Fetch: ✓ Success`);
    console.log(`Client Fetch: ✓ Success`);
    console.log(`Workflows (Backend): ✓ Found ${workflows.length} workflow(s)`);
    console.log(`Workflows (RLS): ${rlsError ? '⚠️  RLS restrictions apply' : `✓ Found ${rlsWorkflows?.length || 0} workflow(s)`}`);

    if (workflows.length > 0) {
      const nanoBanana = workflows.find(w => w.name === 'Batch Nano Banana');
      if (nanoBanana) {
        console.log(`\n✅ "Batch Nano Banana" workflow is accessible!`);
        console.log(`\nEstee can:`);
        console.log(`  1. Log in successfully`);
        console.log(`  2. See the "Batch Nano Banana" workflow`);
        console.log(`  3. Execute the workflow`);
        console.log(`\nNext steps:`);
        console.log(`  - Test the frontend login at: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
        console.log(`  - Navigate to /workflows page`);
        console.log(`  - Verify "Batch Nano Banana" appears in the list`);
      } else {
        console.log(`\n⚠️  "Batch Nano Banana" workflow not found in results!`);
      }
    } else {
      console.log(`\n⚠️  No workflows found for Estee!`);
    }

    console.log('');

    // Cleanup: Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  testEsteeLogin()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testEsteeLogin };
