require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  console.log('Testing service role bypass...\n');
  
  // Create admin client
  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );
  
  console.log('Querying users table with service role...');
  const { data, error } = await admin
    .from('users')
    .select('*');
  
  if (error) {
    console.error('ERROR:', error);
    return;
  }
  
  console.log('✓ Success! Found', data.length, 'users');
  data.forEach(u => {
    console.log(`  - ${u.email} (${u.role})`);
  });
}

test().then(() => process.exit(0));
