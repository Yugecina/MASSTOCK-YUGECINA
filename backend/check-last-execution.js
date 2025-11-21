const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sscxhqgbhdhdklmqniim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3hocWdiaGRoZGtsbXFuaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzExNDcwMywiZXhwIjoyMDc4NjkwNzAzfQ.8-QuJfcldUfjMNw5B6594zC9ERgHhyguBeRlFgL9VuE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExecution() {
  // Get latest execution
  const { data: execution, error: execError } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (execError) {
    console.error('Error fetching execution:', execError);
    return;
  }

  console.log('\n📊 Latest Execution:');
  console.log('ID:', execution.id);
  console.log('Status:', execution.status);
  console.log('Output data:', JSON.stringify(execution.output_data, null, 2));
  console.log('Error:', execution.error_message);
  console.log('Started:', execution.started_at);
  console.log('Completed:', execution.completed_at);

  // Get batch results
  const { data: batchResults, error: batchError } = await supabase
    .from('workflow_batch_results')
    .select('*')
    .eq('execution_id', execution.id)
    .order('batch_index', { ascending: true });

  if (batchError) {
    console.error('Error fetching batch results:', batchError);
    return;
  }

  console.log('\n📦 Batch Results:', batchResults.length);
  batchResults.forEach((result, idx) => {
    console.log(`\n  Result ${idx + 1}:`);
    console.log('    Batch index:', result.batch_index);
    console.log('    Status:', result.status);
    console.log('    Prompt:', result.prompt_text?.substring(0, 50) + '...');
    console.log('    Result URL:', result.result_url);
    console.log('    Error:', result.error_message);
    console.log('    Processing time:', result.processing_time_ms, 'ms');
  });
}

checkExecution();
