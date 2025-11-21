const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sscxhqgbhdhdklmqniim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3hocWdiaGRoZGtsbXFuaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzExNDcwMywiZXhwIjoyMDc4NjkwNzAzfQ.8-QuJfcldUfjMNw5B6594zC9ERgHhyguBeRlFgL9VuE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkflow() {
  const { data, error } = await supabase
    .from('workflows')
    .select('id, name, config')
    .eq('name', 'Batch Nano Banana')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Workflow Configuration:');
  console.log('ID:', data.id);
  console.log('Name:', data.name);
  console.log('\nConfig:');
  console.log(JSON.stringify(data.config, null, 2));
}

checkWorkflow();
