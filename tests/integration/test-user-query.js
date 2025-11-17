require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function testQuery() {
  try {
    // First login to get user ID
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'admin@masstock.com',
      password: 'Admin123123'
    });
    
    if (authError) {
      console.error('Auth failed:', authError.message);
      return;
    }
    
    console.log('Auth successful, user ID:', authData.user.id);
    
    // Now try to fetch from users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userError) {
      console.error('User query error:', userError);
      return;
    }
    
    if (!user) {
      console.error('No user found!');
      return;
    }
    
    console.log('✓ User found!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery().then(() => process.exit(0));
