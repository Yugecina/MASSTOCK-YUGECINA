/**
 * Check Supabase Auth Users
 * Lists all users in Supabase Auth and checks if Estee exists
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function checkAuthUsers() {
  console.log('Checking Supabase Auth users...\n');

  try {
    // List all auth users
    console.log('Fetching all auth users...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    console.log(`\nTotal auth users: ${authData.users.length}\n`);
    console.log('═'.repeat(100));
    console.log('AUTH USERS');
    console.log('═'.repeat(100));

    authData.users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   Auth ID: ${user.id}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    });

    console.log('\n' + '═'.repeat(100));

    // Check for Estee specifically
    const esteeAuthUser = authData.users.find(u => u.email === 'estee@masstock.com');

    if (esteeAuthUser) {
      console.log('\n✓ Estee found in auth.users:');
      console.log(`  - Auth ID: ${esteeAuthUser.id}`);
      console.log(`  - Email: ${esteeAuthUser.email}`);
      console.log(`  - Email Confirmed: ${esteeAuthUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`  - Created: ${new Date(esteeAuthUser.created_at).toLocaleString()}`);

      // Check if Estee exists in users table
      console.log('\nChecking users table...');
      const { data: dbUser, error: dbError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, status')
        .eq('id', esteeAuthUser.id)
        .single();

      if (dbError) {
        console.log(`⚠️  Estee NOT found in users table!`);
        console.log(`Error: ${dbError.message}`);
        console.log('\nACTION REQUIRED: Run migration to sync auth.users with users table');
      } else {
        console.log('✓ Estee found in users table:');
        console.log(`  - User ID: ${dbUser.id}`);
        console.log(`  - Email: ${dbUser.email}`);
        console.log(`  - Role: ${dbUser.role}`);
        console.log(`  - Status: ${dbUser.status}`);
      }

      // Check if Estee has a client
      console.log('\nChecking clients table...');
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, name, email, user_id, status')
        .eq('user_id', esteeAuthUser.id)
        .single();

      if (clientError) {
        console.log(`⚠️  Estee has no client record!`);
        console.log(`Error: ${clientError.message}`);

        // Check if client exists with different user_id
        const { data: clientByEmail } = await supabaseAdmin
          .from('clients')
          .select('id, name, email, user_id, status')
          .eq('email', 'estee@masstock.com')
          .single();

        if (clientByEmail) {
          console.log(`\n⚠️  Client exists but user_id doesn't match!`);
          console.log(`  - Client ID: ${clientByEmail.id}`);
          console.log(`  - Client user_id: ${clientByEmail.user_id}`);
          console.log(`  - Auth user ID: ${esteeAuthUser.id}`);
          console.log(`\nACTION REQUIRED: Update client.user_id to match auth.users.id`);
          console.log(`\nSQL to fix:\n`);
          console.log(`UPDATE clients`);
          console.log(`SET user_id = '${esteeAuthUser.id}'`);
          console.log(`WHERE id = '${clientByEmail.id}';\n`);
        }
      } else {
        console.log('✓ Estee has a client:');
        console.log(`  - Client ID: ${client.id}`);
        console.log(`  - Name: ${client.name}`);
        console.log(`  - Email: ${client.email}`);
        console.log(`  - Status: ${client.status}`);
      }

      // Suggest password reset
      console.log('\n' + '─'.repeat(100));
      console.log('PASSWORD RESET');
      console.log('─'.repeat(100));
      console.log('\nIf you need to reset Estee\'s password, you can:');
      console.log('1. Use Supabase Dashboard > Authentication > Users');
      console.log('2. Click on Estee\'s user and select "Send Magic Link"');
      console.log('3. Or use the admin API to set a new password\n');

    } else {
      console.log('\n❌ Estee NOT found in auth.users!');
      console.log('\nACTION REQUIRED: Create Estee user in Supabase Auth');
      console.log('\nTo create Estee user:');
      console.log('1. Go to Supabase Dashboard > Authentication > Users');
      console.log('2. Click "Add User"');
      console.log('3. Email: estee@masstock.com');
      console.log('4. Password: Estee123123');
      console.log('5. Confirm email automatically');
      console.log('\nOr run the following script to create via API:\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkAuthUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkAuthUsers };
