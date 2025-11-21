/**
 * Reset Estee Password
 * Updates Estee's password to a known value for testing
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function resetEsteePassword() {
  console.log('Resetting Estee password...\n');

  try {
    // Find Estee in auth
    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const esteeAuthUser = authData.users.find(u => u.email === 'estee@masstock.com');

    if (!esteeAuthUser) {
      throw new Error('Estee user not found in auth.users');
    }

    console.log('Found Estee user:');
    console.log(`  - Auth ID: ${esteeAuthUser.id}`);
    console.log(`  - Email: ${esteeAuthUser.email}\n`);

    // Reset password
    const newPassword = 'Estee123123';
    console.log(`Setting new password: ${newPassword}`);

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      esteeAuthUser.id,
      {
        password: newPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log('\n✅ Password reset successful!\n');
    console.log('═'.repeat(100));
    console.log('ESTEE LOGIN CREDENTIALS');
    console.log('═'.repeat(100));
    console.log(`\nEmail: estee@masstock.com`);
    console.log(`Password: ${newPassword}`);
    console.log(`\nUser ID: ${esteeAuthUser.id}`);
    console.log(`Email Confirmed: Yes\n`);

    console.log('You can now log in as Estee with these credentials.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  resetEsteePassword()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { resetEsteePassword };
