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

async function fixEsteeUser() {
    console.log('🔧 Fixing Estee User...');

    const email = 'estee@masstock.com';
    const password = 'EsteePassword123!';
    const clientEmail = 'contact@estee-agency.com';

    try {
        // 1. Check if user exists in Auth
        console.log(`Checking if user ${email} exists...`);
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        let user = users.find(u => u.email === email);

        if (!user) {
            console.log('User not found. Creating...');
            const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: 'Estee Admin' }
            });

            if (createError) throw createError;
            user = data.user;
            console.log('✅ User created:', user.id);
        } else {
            console.log('ℹ️ User already exists:', user.id);
            // Optional: Update password to ensure it matches
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
            if (updateError) console.warn('⚠️ Failed to update password:', updateError.message);
            else console.log('✅ Password updated/verified');
        }

        // 2. Link User to Client
        console.log(`Linking user ${user.id} to client ${clientEmail}...`);

        // First, ensure the user has the 'user' role in public.users (should be handled by trigger, but good to verify)
        const { error: updateRoleError } = await supabaseAdmin
            .from('users')
            .update({ role: 'user' })
            .eq('id', user.id);

        if (updateRoleError) console.warn('⚠️ Failed to update user role:', updateRoleError.message);

        // Update client record
        const { data: clients, error: clientError } = await supabaseAdmin
            .from('clients')
            .update({ user_id: user.id })
            .eq('email', clientEmail)
            .select();

        if (clientError) {
            console.error('❌ Failed to update client:', clientError.message);
        } else if (clients && clients.length > 0) {
            console.log(`✅ ${clients.length} client(s) linked successfully`);
            clients.forEach(c => console.log(`   - Client ID: ${c.id}`));
        } else {
            console.warn('⚠️ Client not found with email:', clientEmail);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixEsteeUser();
