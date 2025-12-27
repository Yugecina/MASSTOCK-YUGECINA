/**
 * Check if user has client association
 * Debug script for 403 error investigation
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const USER_ID = 'cc1f0303-bf17-4156-8e7c-d2bbf3dc6554';

async function checkUserClient() {
  try {
    console.log('🔍 Checking user client association...');
    console.log('User ID:', USER_ID);

    // Check user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (userError) {
      console.error('❌ User not found in users table:', userError.message);
      return;
    }

    console.log('\n✅ User found:');
    console.log('  Email:', userData.email);
    console.log('  Role:', userData.role);
    console.log('  Client ID (legacy):', userData.client_id);

    // Check client_members table
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('client_members')
      .select('*')
      .eq('user_id', USER_ID);

    if (memberError) {
      console.error('\n❌ Error querying client_members:', memberError.message);
      return;
    }

    console.log('\n📋 Client memberships found:', memberData?.length || 0);
    if (memberData && memberData.length > 0) {
      memberData.forEach((membership, index) => {
        console.log(`\n  Membership ${index + 1}:`);
        console.log('    Client ID:', membership.client_id);
        console.log('    Role:', membership.role);
        console.log('    Joined:', membership.joined_at);
      });

      // Get client details
      const clientId = memberData[0].client_id;
      const { data: clientData } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientData) {
        console.log('\n✅ Client details:');
        console.log('    Name:', clientData.name);
        console.log('    Subscription:', clientData.subscription_tier);
        console.log('    Status:', clientData.status);
      }
    } else {
      console.log('\n⚠️  NO CLIENT MEMBERSHIPS FOUND!');
      console.log('This is the root cause of the 403 error.');
      console.log('\nFix: Insert user into client_members table');

      // Check if user has legacy client_id
      if (userData.client_id) {
        console.log('\n💡 User has legacy client_id:', userData.client_id);
        console.log('Attempting to migrate to client_members...');

        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('client_members')
          .insert({
            client_id: userData.client_id,
            user_id: USER_ID,
            role: userData.role,
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Migration failed:', insertError.message);
        } else {
          console.log('✅ User migrated to client_members successfully!');
          console.log('  Client ID:', insertData.client_id);
          console.log('  Role:', insertData.role);
        }
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkUserClient();
