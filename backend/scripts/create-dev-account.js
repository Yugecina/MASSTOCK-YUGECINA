/**
 * Create Dev Account Script
 * Creates MasStock Enterprise client with dev@masstock.com owner
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function createDevAccount() {
  console.log('Creating Dev account...\n');

  try {
    const DEV_EMAIL = 'dev@masstock.com';
    const DEV_PASSWORD = 'DevPassword123!';
    const DEV_NAME = 'Dev MasStock';
    const CLIENT_NAME = 'MasStock Enterprise';
    const CLIENT_EMAIL = 'dev@masstock.com';

    // Step 1: Check if client already exists
    console.log('Step 1: Checking if MasStock client already exists...');
    const { data: existingClients, error: clientCheckError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, status')
      .eq('email', CLIENT_EMAIL);

    if (clientCheckError) {
      throw new Error(`Error checking clients: ${clientCheckError.message}`);
    }

    let clientId;

    if (existingClients && existingClients.length > 0) {
      clientId = existingClients[0].id;
      console.log(`ℹ Client already exists:`);
      console.log(`  - ID: ${existingClients[0].id}`);
      console.log(`  - Name: ${existingClients[0].name}`);
      console.log(`  - Email: ${existingClients[0].email}`);
      console.log(`  - Status: ${existingClients[0].status}\n`);
    } else {
      // Create the client
      console.log('Creating MasStock client...');
      const { data: newClient, error: clientInsertError } = await supabaseAdmin
        .from('clients')
        .insert([{
          name: CLIENT_NAME,
          company_name: CLIENT_NAME,
          email: CLIENT_EMAIL,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (clientInsertError) {
        throw new Error(`Error creating client: ${clientInsertError.message}`);
      }

      clientId = newClient.id;
      console.log('✓ Client created successfully!');
      console.log(`  - ID: ${newClient.id}`);
      console.log(`  - Name: ${newClient.name}\n`);
    }

    // Step 2: Check if auth user already exists
    console.log('Step 2: Checking if auth user already exists...');
    const { data: authData, error: authListError } = await supabaseAdmin.auth.admin.listUsers();

    if (authListError) {
      throw new Error(`Error listing auth users: ${authListError.message}`);
    }

    const existingAuthUser = authData.users.find(u => u.email === DEV_EMAIL);
    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      console.log(`ℹ Auth user already exists:`);
      console.log(`  - ID: ${existingAuthUser.id}`);
      console.log(`  - Email: ${existingAuthUser.email}\n`);
    } else {
      // Create auth user
      console.log('Creating auth user...');
      const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: DEV_NAME
        }
      });

      if (authCreateError) {
        throw new Error(`Error creating auth user: ${authCreateError.message}`);
      }

      authUserId = authUser.user.id;
      console.log('✓ Auth user created successfully!');
      console.log(`  - ID: ${authUser.user.id}`);
      console.log(`  - Email: ${authUser.user.email}\n`);
    }

    // Step 3: Check if user exists in users table
    console.log('Step 3: Checking if user exists in users table...');
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, status')
      .eq('id', authUserId);

    if (userCheckError) {
      throw new Error(`Error checking users: ${userCheckError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(`ℹ User already exists in users table:`);
      console.log(`  - ID: ${existingUsers[0].id}`);
      console.log(`  - Email: ${existingUsers[0].email}`);
      console.log(`  - Name: ${existingUsers[0].name}`);
      console.log(`  - Role: ${existingUsers[0].role}\n`);
    } else {
      // Create user in users table
      console.log('Creating user in users table...');
      const { data: newUser, error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authUserId,
          email: DEV_EMAIL,
          name: DEV_NAME,
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (userInsertError) {
        throw new Error(`Error creating user: ${userInsertError.message}`);
      }

      console.log('✓ User created successfully!');
      console.log(`  - ID: ${newUser.id}`);
      console.log(`  - Email: ${newUser.email}`);
      console.log(`  - Name: ${newUser.name}\n`);
    }

    // Step 4: Check if client_members entry exists
    console.log('Step 4: Checking if client membership exists...');
    const { data: existingMemberships, error: memberCheckError } = await supabaseAdmin
      .from('client_members')
      .select('id, client_id, user_id, role')
      .eq('client_id', clientId)
      .eq('user_id', authUserId);

    if (memberCheckError) {
      throw new Error(`Error checking client_members: ${memberCheckError.message}`);
    }

    if (existingMemberships && existingMemberships.length > 0) {
      console.log(`ℹ Membership already exists:`);
      console.log(`  - ID: ${existingMemberships[0].id}`);
      console.log(`  - Client ID: ${existingMemberships[0].client_id}`);
      console.log(`  - User ID: ${existingMemberships[0].user_id}`);
      console.log(`  - Role: ${existingMemberships[0].role}\n`);
    } else {
      // Create client_members entry
      console.log('Creating client membership...');
      const { data: newMembership, error: memberInsertError } = await supabaseAdmin
        .from('client_members')
        .insert([{
          client_id: clientId,
          user_id: authUserId,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (memberInsertError) {
        throw new Error(`Error creating membership: ${memberInsertError.message}`);
      }

      console.log('✓ Membership created successfully!');
      console.log(`  - ID: ${newMembership.id}`);
      console.log(`  - Client ID: ${newMembership.client_id}`);
      console.log(`  - User ID: ${newMembership.user_id}`);
      console.log(`  - Role: ${newMembership.role}\n`);
    }

    // Step 5: Verify everything
    console.log('Step 5: Verifying configuration...');

    // Get client
    const { data: verifyClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, status')
      .eq('id', clientId)
      .single();

    if (clientError) {
      throw new Error(`Error verifying client: ${clientError.message}`);
    }

    // Get user
    const { data: verifyUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, status')
      .eq('id', authUserId)
      .single();

    if (userError) {
      throw new Error(`Error verifying user: ${userError.message}`);
    }

    // Get membership
    const { data: verifyMembership, error: memberError } = await supabaseAdmin
      .from('client_members')
      .select('id, role')
      .eq('client_id', clientId)
      .eq('user_id', authUserId)
      .single();

    if (memberError) {
      throw new Error(`Error verifying membership: ${memberError.message}`);
    }

    console.log('═'.repeat(80));
    console.log('SUCCESS! Dev account has been created and configured.');
    console.log('═'.repeat(80));
    console.log('\nAccount Details:');
    console.log(`  Email: ${DEV_EMAIL}`);
    console.log(`  Password: ${DEV_PASSWORD}`);
    console.log(`  Client: ${verifyClient.name}`);
    console.log(`  Role: ${verifyMembership.role}`);
    console.log(`  User Status: ${verifyUser.status}`);
    console.log(`  Client Status: ${verifyClient.status}`);
    console.log('\nYou can now:');
    console.log('  1. Log in at http://localhost:5173/login');
    console.log(`  2. Use email: ${DEV_EMAIL}`);
    console.log(`  3. Use password: ${DEV_PASSWORD}`);
    console.log('  4. Access client workflows and features\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createDevAccount()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createDevAccount };
