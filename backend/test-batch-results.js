const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sscxhqgbhdhdklmqniim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3hocWdiaGRoZGtsbXFuaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzExNDcwMywiZXhwIjoyMDc4NjkwNzAzfQ.8-QuJfcldUfjMNw5B6594zC9ERgHhyguBeRlFgL9VuE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBatchResults() {
  const executionId = '2518e10a-5380-4e87-811c-e771de621e00';

  console.log('\n🔍 Testing Batch Results Retrieval');
  console.log('Execution ID:', executionId);
  console.log('');

  // 1. Get execution details
  const { data: execution, error: execError } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (execError) {
    console.error('❌ Error fetching execution:', execError.message);
    return;
  }

  if (!execution) {
    console.error('❌ Execution not found!');
    return;
  }

  console.log('✅ Execution Found:');
  console.log('   Status:', execution.status);
  console.log('   Workflow ID:', execution.workflow_id);
  console.log('   Client ID:', execution.client_id);
  console.log('   Created:', execution.created_at);
  console.log('   Started:', execution.started_at);
  console.log('   Completed:', execution.completed_at);
  console.log('   Duration:', execution.duration_seconds, 'seconds');
  console.log('   Output:', JSON.stringify(execution.output_data, null, 2));
  console.log('');

  // 2. Get batch results
  const { data: batchResults, error: batchError } = await supabase
    .from('workflow_batch_results')
    .select('*')
    .eq('execution_id', executionId)
    .order('batch_index', { ascending: true });

  if (batchError) {
    console.error('❌ Error fetching batch results:', batchError.message);
    return;
  }

  console.log('📦 Batch Results:', batchResults.length, 'results');
  console.log('');

  batchResults.forEach((result, index) => {
    console.log('Result', index + 1 + ':');
    console.log('  ├─ Batch Index:', result.batch_index);
    console.log('  ├─ Status:', result.status);
    console.log('  ├─ Prompt:', result.prompt_text?.substring(0, 60) + '...');
    console.log('  ├─ Created:', result.created_at);
    console.log('  ├─ Completed:', result.completed_at);
    console.log('  ├─ Processing Time:', result.processing_time_ms, 'ms');

    if (result.status === 'completed') {
      console.log('  ├─ ✅ Result URL:', result.result_url);
      console.log('  └─ Storage Path:', result.result_storage_path);
    } else if (result.status === 'failed') {
      console.log('  └─ ❌ Error:', result.error_message);
    } else {
      console.log('  └─ ⏳ Status:', result.status);
    }
    console.log('');
  });

  // 3. Get stats
  const { data: stats } = await supabase
    .rpc('get_batch_execution_stats', { p_execution_id: executionId });

  if (stats && stats[0]) {
    console.log('📊 Statistics:');
    console.log('   Total:', stats[0].total_count);
    console.log('   Completed:', stats[0].completed_count);
    console.log('   Failed:', stats[0].failed_count);
    console.log('   Processing:', stats[0].processing_count);
    console.log('   Avg Time:', stats[0].avg_processing_time_ms, 'ms');
    console.log('');
  }

  // 4. Test the actual endpoint format
  console.log('🌐 API Endpoint to call:');
  console.log('   GET /api/executions/' + executionId + '/batch-results');
  console.log('');
}

testBatchResults();
