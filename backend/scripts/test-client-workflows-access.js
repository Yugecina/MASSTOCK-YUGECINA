/**
 * Test client_workflows access with SERVICE_ROLE_KEY
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function testAccess() {
  console.log('\n🔍 Testing client_workflows access with SERVICE_ROLE_KEY\n');

  try {
    // Test 1: Direct query with service role
    console.log('Test 1: Query client_workflows table directly');
    const { data: allRecords, error: allError } = await supabaseAdmin
      .from('client_workflows')
      .select('*');

    if (allError) {
      console.error('❌ Error querying client_workflows:', allError);
    } else {
      console.log(`✅ Found ${allRecords.length} records in client_workflows:`);
      allRecords.forEach(r => {
        console.log(`   - Client: ${r.client_id}, Workflow: ${r.workflow_id}, Active: ${r.is_active}`);
      });
    }

    // Test 2: Query for specific client and workflow (like backend does)
    const esteeClientId = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';
    const workflowId = 'f8b20b59-7d06-4599-8413-64da74225b0c';

    console.log(`\nTest 2: Query access for Estee (${esteeClientId})`);
    const { data: access, error: accessError } = await supabaseAdmin
      .from('client_workflows')
      .select('*')
      .eq('client_id', esteeClientId)
      .eq('workflow_id', workflowId)
      .eq('is_active', true)
      .maybeSingle();

    if (accessError) {
      console.error('❌ Error checking access:', accessError);
    } else if (!access) {
      console.error('❌ No access record found (returns null)');
    } else {
      console.log('✅ Access record found:', access);
    }

    // Test 3: Test with Dev client
    const devClientId = 'f14a2f20-f81f-4d8b-93ec-96d6e59cff06';
    console.log(`\nTest 3: Query access for Dev (${devClientId})`);
    const { data: devAccess, error: devError } = await supabaseAdmin
      .from('client_workflows')
      .select('*')
      .eq('client_id', devClientId)
      .eq('workflow_id', workflowId)
      .eq('is_active', true)
      .maybeSingle();

    if (devError) {
      console.error('❌ Error checking Dev access:', devError);
    } else if (!devAccess) {
      console.error('❌ No Dev access record found (returns null)');
    } else {
      console.log('✅ Dev access record found:', devAccess);
    }

    // Test 4: Check RLS policies
    console.log('\nTest 4: Check if RLS is causing issues');
    console.log('SERVICE_ROLE_KEY should bypass RLS...');
    console.log('KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

  } catch (err) {
    console.error('\n❌ Fatal error:', err);
  }
}

testAccess()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });
