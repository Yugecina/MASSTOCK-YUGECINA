const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSync() {
  // Get auth user
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  
  console.log('=== Auth Users ===');
  authUsers.forEach(u => {
    console.log(`${u.email} (${u.id})`);
  });
  
  // Get public users
  const { data: publicUsers } = await supabase
    .from('users')
    .select('id, email, role, status');
  
  console.log('\n=== Public Users ===');
  publicUsers.forEach(u => {
    console.log(`${u.email} (${u.id}) - ${u.role}/${u.status}`);
  });
  
  // Find mismatches
  console.log('\n=== Missing in public.users ===');
  authUsers.forEach(au => {
    const found = publicUsers.find(pu => pu.id === au.id);
    if (!found) {
      console.log(`MISSING: ${au.email} (${au.id})`);
    }
  });
}

checkSync().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
