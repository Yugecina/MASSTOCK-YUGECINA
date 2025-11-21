/**
 * Check Estee User Configuration
 * Verifies that Estee user is properly linked to Estee client
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function checkEsteeUser() {
  console.log('Checking Estee user configuration...\n');

  try {
    // Find Estee client
    console.log('Step 1: Finding Estee client...');
    const { data: esteeClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, user_id, email, name, status')
      .eq('email', 'estee@masstock.com')
      .single();

    if (clientError) {
      throw new Error(`Error finding Estee client: ${clientError.message}`);
    }

    console.log('✓ Found Estee client:');
    console.log(`  - Client ID: ${esteeClient.id}`);
    console.log(`  - User ID: ${esteeClient.user_id}`);
    console.log(`  - Email: ${esteeClient.email}`);
    console.log(`  - Name: ${esteeClient.name}`);
    console.log(`  - Status: ${esteeClient.status}\n`);

    // Find Estee user in users table
    console.log('Step 2: Finding Estee user in users table...');
    const { data: esteeUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, created_at')
      .eq('id', esteeClient.user_id)
      .single();

    if (userError) {
      console.error(`❌ ERROR: Could not find user with ID ${esteeClient.user_id}`);
      console.error(`Error: ${userError.message}\n`);

      // Search for Estee user by email
      console.log('Searching for Estee user by email...');
      const { data: userByEmail, error: emailError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, created_at')
        .eq('email', 'estee@masstock.com');

      if (emailError) {
        throw new Error(`Error searching for user: ${emailError.message}`);
      }

      if (!userByEmail || userByEmail.length === 0) {
        console.error('❌ No user found with email estee@masstock.com');
        console.log('\n⚠️  The Estee client exists but is not linked to a valid user!');
        console.log('This will prevent Estee from accessing their workflows.\n');

        // Check auth.users
        console.log('Step 3: Checking Supabase Auth users...');
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
          console.error(`Error listing auth users: ${authError.message}`);
        } else {
          const esteeAuthUser = authUsers.users.find(u => u.email === 'estee@masstock.com');
          if (esteeAuthUser) {
            console.log('✓ Found Estee in auth.users:');
            console.log(`  - Auth ID: ${esteeAuthUser.id}`);
            console.log(`  - Email: ${esteeAuthUser.email}`);
            console.log(`  - Created: ${esteeAuthUser.created_at}`);
            console.log('\n⚠️  ACTION REQUIRED: Update clients.user_id to match auth.users.id');
            console.log(`\nRun this SQL to fix:\n`);
            console.log(`UPDATE clients`);
            console.log(`SET user_id = '${esteeAuthUser.id}'`);
            console.log(`WHERE id = '${esteeClient.id}';\n`);
          } else {
            console.log('❌ Estee not found in auth.users either!');
            console.log('\n⚠️  ACTION REQUIRED: Create Estee user account first');
          }
        }

        return;
      }

      console.log(`Found user(s) with email estee@masstock.com:`);
      userByEmail.forEach(user => {
        console.log(`  - User ID: ${user.id}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Role: ${user.role}`);
        console.log(`  - Created: ${new Date(user.created_at).toLocaleString()}\n`);
      });

      console.log('⚠️  WARNING: Client user_id does not match any user!');
      console.log(`  - Client user_id: ${esteeClient.user_id}`);
      console.log(`  - User ID in users table: ${userByEmail[0]?.id || 'N/A'}\n`);

      if (userByEmail.length > 0 && userByEmail[0].id !== esteeClient.user_id) {
        console.log('ACTION REQUIRED: Update client.user_id to match users.id\n');
        console.log(`Run this SQL to fix:\n`);
        console.log(`UPDATE clients`);
        console.log(`SET user_id = '${userByEmail[0].id}'`);
        console.log(`WHERE id = '${esteeClient.id}';\n`);
      }

      return;
    }

    console.log('✓ Found Estee user:');
    console.log(`  - User ID: ${esteeUser.id}`);
    console.log(`  - Email: ${esteeUser.email}`);
    console.log(`  - Role: ${esteeUser.role}`);
    console.log(`  - Created: ${new Date(esteeUser.created_at).toLocaleString()}\n`);

    // Verify linkage
    console.log('Step 3: Verifying linkage...');
    if (esteeClient.user_id === esteeUser.id) {
      console.log('✓ Client and User are properly linked!\n');
    } else {
      console.log('❌ ERROR: Client user_id does not match user ID!');
      console.log(`  - Client user_id: ${esteeClient.user_id}`);
      console.log(`  - User ID: ${esteeUser.id}\n`);
      return;
    }

    // Check workflows
    console.log('Step 4: Checking workflows for Estee...');
    const { data: workflows, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, status, client_id')
      .eq('client_id', esteeClient.id);

    if (workflowError) {
      throw new Error(`Error fetching workflows: ${workflowError.message}`);
    }

    console.log(`✓ Found ${workflows.length} workflow(s) for Estee:\n`);
    workflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.name}`);
      console.log(`   ID: ${wf.id}`);
      console.log(`   Status: ${wf.status}`);
      console.log(`   Client ID: ${wf.client_id}\n`);
    });

    // Summary
    console.log('═'.repeat(100));
    console.log('CONFIGURATION SUMMARY');
    console.log('═'.repeat(100));
    console.log(`\nEstee Client ID: ${esteeClient.id}`);
    console.log(`Estee User ID: ${esteeUser.id}`);
    console.log(`Link Status: ${esteeClient.user_id === esteeUser.id ? '✓ Properly linked' : '❌ Not linked'}`);
    console.log(`User Role: ${esteeUser.role}`);
    console.log(`Client Status: ${esteeClient.status}`);
    console.log(`Number of Workflows: ${workflows.length}`);
    console.log(`Deployed Workflows: ${workflows.filter(w => w.status === 'deployed').length}`);

    if (esteeClient.user_id === esteeUser.id && workflows.length > 0) {
      console.log('\n✅ Everything is configured correctly!');
      console.log('\nEstee should be able to:');
      console.log(`  1. Log in with: ${esteeUser.email}`);
      console.log(`  2. See ${workflows.filter(w => w.status === 'deployed').length} deployed workflow(s)`);
      console.log(`  3. Access the "Batch Nano Banana" workflow\n`);
    } else {
      console.log('\n⚠️  Configuration issues detected. See details above.\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkEsteeUser()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkEsteeUser };
