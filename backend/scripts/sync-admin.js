require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function syncAdmin() {
  try {
    console.log('Fetching admin user from auth.users...');
    
    // Get admin from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} users in auth.users`);
    
    // Find admin user
    const adminUser = authUsers.users.find(u => u.email === 'admin@masstock.com');
    
    if (!adminUser) {
      console.log('Admin user not found in auth.users');
      return;
    }
    
    console.log('Admin found in auth.users:', adminUser.email, 'ID:', adminUser.id);
    
    // Check if already in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (existingUser) {
      console.log('Admin already exists in public.users');
      return;
    }
    
    // Sync to public.users
    console.log('Syncing admin to public.users...');
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        status: 'active',
        created_at: adminUser.created_at,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting user:', insertError);
      return;
    }
    
    console.log('✓ Admin user synced successfully!');
    console.log('User ID:', newUser.id);
    console.log('Email:', newUser.email);
    console.log('Role:', newUser.role);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

syncAdmin().then(() => {
  console.log('Done');
  process.exit(0);
});
