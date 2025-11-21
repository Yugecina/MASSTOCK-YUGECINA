require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function testExecutions() {
  try {
    console.log('🔍 Testing executions endpoint logic...\n');

    const workflowId = 'f8b20b59-7d06-4599-8413-64da74225b0c';
    const clientId = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';

    // Step 1: Verify workflow exists and belongs to client
    console.log('Step 1: Verify workflow...');
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, client_id')
      .eq('id', workflowId)
      .eq('client_id', clientId)
      .single();

    if (workflowError) {
      console.error('❌ Workflow query error:', workflowError);
      return;
    }

    if (!workflow) {
      console.error('❌ Workflow not found');
      return;
    }

    console.log('✅ Workflow found:', workflow);

    // Step 2: Get executions
    console.log('\nStep 2: Get executions...');
    const limit = 50;
    const offset = 0;

    const { data: executions, error: execError, count } = await supabaseAdmin
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (execError) {
      console.error('❌ Executions query error:', execError);
      return;
    }

    console.log(`✅ Found ${executions.length} executions (total: ${count})`);
    console.log('\nFirst 3 executions:');
    executions.slice(0, 3).forEach((exec, i) => {
      console.log(`  ${i + 1}. ID: ${exec.id}, Status: ${exec.status}, Created: ${exec.created_at}`);
    });

    // Step 3: Test response format
    console.log('\nStep 3: Response format...');
    const response = {
      success: true,
      data: {
        executions,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };

    console.log('✅ Response structure:', {
      success: response.success,
      dataKeys: Object.keys(response.data),
      executionsCount: response.data.executions.length,
      total: response.data.total
    });

    console.log('\n🎉 All tests passed!');

  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    process.exit(0);
  }
}

testExecutions();
