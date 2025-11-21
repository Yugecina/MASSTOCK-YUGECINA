require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function testWorkflowsAPI() {
  try {
    console.log('🔍 Testing workflows API logic...\n');

    // The workflow we know exists
    const workflowId = 'f8b20b59-7d06-4599-8413-64da74225b0c';
    const expectedClientId = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';
    const expectedUserId = '60dd743e-5bbb-494b-8094-77a9c97f1673';

    console.log('Known data:');
    console.log(`  Workflow ID: ${workflowId}`);
    console.log(`  Client ID: ${expectedClientId}`);
    console.log(`  User ID: ${expectedUserId}\n`);

    // Step 1: Verify client exists
    console.log('Step 1: Check if client exists...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', expectedClientId)
      .single();

    if (clientError) {
      console.error('❌ Client query error:', clientError);
      return;
    }

    if (!client) {
      console.error('❌ Client not found!');
      return;
    }

    console.log('✅ Client found:', {
      id: client.id,
      user_id: client.user_id,
      status: client.status
    });

    // Step 2: Check user
    console.log('\nStep 2: Check user...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', expectedUserId)
      .single();

    if (userError) {
      console.error('❌ User query error:', userError);
      return;
    }

    console.log('✅ User found:', user);

    // Step 3: Query workflows like the API does
    console.log('\nStep 3: Query workflows for client...');
    const { data: workflows, error: workflowsError } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('client_id', expectedClientId)
      .order('created_at', { ascending: false });

    if (workflowsError) {
      console.error('❌ Workflows query error:', workflowsError);
      return;
    }

    console.log(`✅ Found ${workflows.length} workflows`);
    workflows.forEach((wf, i) => {
      console.log(`  ${i + 1}. ${wf.name} (ID: ${wf.id})`);
    });

    // Step 4: Check if there are any workflows at all
    console.log('\nStep 4: Check all workflows in DB...');
    const { data: allWorkflows, error: allError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, client_id')
      .limit(10);

    if (allError) {
      console.error('❌ All workflows query error:', allError);
      return;
    }

    console.log(`Total workflows in DB: ${allWorkflows.length}`);
    allWorkflows.forEach((wf, i) => {
      console.log(`  ${i + 1}. ${wf.name} - client: ${wf.client_id}`);
    });

    console.log('\n🎉 Test complete!');

  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    process.exit(0);
  }
}

testWorkflowsAPI();
