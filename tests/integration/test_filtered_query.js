const { supabaseAdmin } = require('./src/config/database');

async function testQuery() {
  const clientId = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';
  
  console.log('Testing filtered workflow query...\n');
  console.log('Client ID:', clientId);
  
  // Try exact same query as controller
  const { data, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Found', data.length, 'workflows');
    data.forEach(w => console.log(' -', w.name, '(', w.client_id, ')'));
  }
}

testQuery().then(() => process.exit(0));
