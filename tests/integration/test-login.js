require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function testLogin() {
  try {
    console.log('Testing login with admin@masstock.com...');
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: 'admin@masstock.com',
      password: 'Admin123123'
    });
    
    if (error) {
      console.error('Login failed:', error.message);
      return;
    }
    
    console.log('✓ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Token length:', data.session.access_token.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin().then(() => process.exit(0));
