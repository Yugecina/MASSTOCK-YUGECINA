const { supabaseAdmin } = require('./src/config/database');

async function testQuery() {
  console.log('Testing direct workflow query with service role...\n');
  
  // Try to query workflows directly
  const { data, error } = await supabaseAdmin
    .from('workflows')
    .select('id, name, client_id')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Found', data.length, 'workflows:');
    data.forEach(w => console.log(' -', w.name));
  }
}

testQuery().then(() => process.exit(0));
