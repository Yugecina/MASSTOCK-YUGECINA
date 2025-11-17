const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('=== Checking Database State ===\n');
  
  // Check users
  const { data: users } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', 'estee@masstock.com');
  
  console.log('User estee@masstock.com:', JSON.stringify(users, null, 2));
  
  if (users && users.length > 0) {
    const userId = users[0].id;
    
    // Check client for this user
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);
    
    console.log('\nClient for user_id:', JSON.stringify(clients, null, 2));
    
    if (clients && clients.length > 0) {
      const clientId = clients[0].id;
      
      // Check workflows for this client
      const { data: workflows } = await supabase
        .from('workflows')
        .select('id, name, status')
        .eq('client_id', clientId);
      
      console.log('\nWorkflows for client:', JSON.stringify(workflows, null, 2));
    }
  }
  
  // Also check all clients
  const { data: allClients } = await supabase
    .from('clients')
    .select('id, user_id, email, name');
  
  console.log('\n=== All Clients ===');
  console.log(JSON.stringify(allClients, null, 2));
}

checkData().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
