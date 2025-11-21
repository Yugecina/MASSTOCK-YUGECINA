const { supabaseAdmin } = require('./src/config/database');

async function check() {
  console.log('Checking Estee data...\n');

  const clientId = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';

  // Check executions
  const { data: execs, error: execError } = await supabaseAdmin
    .from('workflow_executions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('=== EXECUTIONS ===');
  console.log('Error:', execError);
  console.log('Count:', execs?.length || 0);
  if (execs && execs.length > 0) {
    execs.forEach((e, i) => {
      console.log(`\n${i+1}. ${e.id}`);
      console.log(`   Status: ${e.status}`);
      console.log(`   Workflow ID: ${e.workflow_id}`);
      console.log(`   Created: ${e.created_at}`);
    });
  }

  // Check workflows
  const { data: wfs, error: wfError } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('client_id', clientId);

  console.log('\n\n=== WORKFLOWS ===');
  console.log('Error:', wfError);
  console.log('Count:', wfs?.length || 0);
  if (wfs && wfs.length > 0) {
    wfs.forEach((w, i) => {
      console.log(`\n${i+1}. ${w.name}`);
      console.log(`   ID: ${w.id}`);
      console.log(`   Status: ${w.status}`);
      console.log(`   Type: ${w.config?.workflow_type || 'standard'}`);
    });
  }

  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
