require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function checkUsers() {
  try {
    // Check auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    console.log('\n=== AUTH.USERS ===');
    authUsers.users.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Created: ${u.created_at}`);
      console.log('---');
    });
    
    // Check public.users
    const { data: publicUsers, error: pubError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    console.log('\n=== PUBLIC.USERS ===');
    if (publicUsers && publicUsers.length > 0) {
      publicUsers.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`Email: ${u.email}`);
        console.log(`Role: ${u.role}`);
        console.log(`Status: ${u.status}`);
        console.log('---');
      });
    } else {
      console.log('No users in public.users');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers().then(() => process.exit(0));
