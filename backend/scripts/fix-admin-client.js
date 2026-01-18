/**
 * Fix Admin Client Association
 *
 * This script ensures admin users can use workflows by:
 * 1. Creating a "MasStock Internal" client
 * 2. Associating admin users to this client via client_members
 *
 * Run once: node backend/scripts/fix-admin-client.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminClient() {
  console.log('🔧 Starting admin client fix...\n');

  try {
    // Step 1: Check if MasStock Internal client exists
    console.log('1️⃣ Checking for MasStock Internal client...');
    let { data: masstockClient, error: clientCheckError } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('email', 'admin@masstock.com')
      .single();

    if (clientCheckError && clientCheckError.code !== 'PGRST116') { // PGRST116 = not found
      throw clientCheckError;
    }

    let clientId;

    if (!masstockClient) {
      // Create MasStock Internal client
      console.log('   📝 Creating MasStock Internal client...');
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          name: 'MasStock Internal',
          company_name: 'MasStock SAS',
          email: 'admin@masstock.com',
          status: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;

      clientId = newClient.id;
      console.log(`   ✅ Created client: ${newClient.name} (${clientId})\n`);
    } else {
      clientId = masstockClient.id;
      console.log(`   ✅ Client already exists: ${masstockClient.name} (${clientId})\n`);
    }

    // Step 2: Get all admin users
    console.log('2️⃣ Finding admin users...');
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'admin');

    if (usersError) throw usersError;

    console.log(`   Found ${adminUsers.length} admin user(s):\n`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
    });
    console.log('');

    // Step 3: Associate each admin to MasStock Internal client
    console.log('3️⃣ Associating admins to MasStock Internal client...');

    for (const user of adminUsers) {
      // Check if association already exists
      const { data: existing } = await supabase
        .from('client_members')
        .select('id')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        console.log(`   ℹ️  ${user.email} already associated`);
        continue;
      }

      // Create association
      const { error: memberError } = await supabase
        .from('client_members')
        .insert({
          client_id: clientId,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error(`   ❌ Failed to associate ${user.email}:`, memberError.message);
      } else {
        console.log(`   ✅ Associated ${user.email} as owner`);
      }
    }

    console.log('\n✅ Admin client fix completed successfully!');
    console.log('\nSummary:');
    console.log(`   Client: MasStock Internal (${clientId})`);
    console.log(`   Admins: ${adminUsers.length} associated`);
    console.log('\nAdmin users can now use workflows like Smart Resizer.');

  } catch (error) {
    console.error('\n❌ Error during admin client fix:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run the fix
fixAdminClient();
