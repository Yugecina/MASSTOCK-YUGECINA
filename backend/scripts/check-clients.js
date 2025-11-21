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

async function checkClients() {
    console.log('🔍 Checking clients table...');

    try {
        const { data: clients, error } = await supabaseAdmin
            .from('clients')
            .select('id, email, user_id, name, company_name')
            .limit(10);

        if (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }

        console.log(`Found ${clients.length} clients:`);
        clients.forEach(c => {
            console.log(`  - ID: ${c.id}`);
            console.log(`    Email: ${c.email}`);
            console.log(`    User ID: ${c.user_id || 'NULL'}`);
            console.log(`    Name: ${c.name}`);
            console.log(`    Company: ${c.company_name}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkClients();
