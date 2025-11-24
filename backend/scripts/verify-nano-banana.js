/**
 * Verify Image Factory Workflow Script
 * Verifies the "Image Factory" workflow is properly configured
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function verifyNanoBananaWorkflow() {
  console.log('Verifying Image Factory workflow configuration...\n');

  try {
    // Get all workflows
    console.log('Fetching all workflows...');
    const { data: allWorkflows, error: allError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, client_id, status, clients(name, email)')
      .order('created_at', { ascending: false });

    if (allError) {
      throw new Error(`Error fetching workflows: ${allError.message}`);
    }

    console.log(`\nTotal workflows in database: ${allWorkflows.length}\n`);
    console.log('All workflows:');
    console.log('─'.repeat(100));
    allWorkflows.forEach((wf, index) => {
      console.log(`${index + 1}. ${wf.name}`);
      console.log(`   ID: ${wf.id}`);
      console.log(`   Status: ${wf.status}`);
      console.log(`   Client: ${wf.clients?.name || 'N/A'} (${wf.clients?.email || 'N/A'})`);
      console.log('');
    });
    console.log('─'.repeat(100));

    // Get Image Factory workflow details
    console.log('\nFetching Image Factory workflow details...');
    const { data: nanoBanana, error: nbError } = await supabaseAdmin
      .from('workflows')
      .select(`
        id,
        name,
        description,
        status,
        client_id,
        config,
        cost_per_execution,
        revenue_per_execution,
        created_at,
        updated_at,
        deployed_at,
        clients (
          id,
          name,
          email
        )
      `)
      .eq('name', 'Image Factory')
      .single();

    if (nbError) {
      if (nbError.code === 'PGRST116') {
        console.error('\n❌ ERROR: Image Factory workflow not found in database!');
        return;
      }
      throw new Error(`Error fetching Image Factory workflow: ${nbError.message}`);
    }

    console.log('\n' + '═'.repeat(100));
    console.log('IMAGE FACTORY WORKFLOW DETAILS');
    console.log('═'.repeat(100));
    console.log(`\nWorkflow ID: ${nanoBanana.id}`);
    console.log(`Name: ${nanoBanana.name}`);
    console.log(`Description: ${nanoBanana.description}`);
    console.log(`Status: ${nanoBanana.status}`);
    console.log(`\nClient Information:`);
    console.log(`  - Client ID: ${nanoBanana.client_id}`);
    console.log(`  - Client Name: ${nanoBanana.clients?.name || 'N/A'}`);
    console.log(`  - Client Email: ${nanoBanana.clients?.email || 'N/A'}`);
    console.log(`\nConfiguration:`);
    console.log(`  - Workflow Type: ${nanoBanana.config.workflow_type}`);
    console.log(`  - Model: ${nanoBanana.config.model}`);
    console.log(`  - API Provider: ${nanoBanana.config.api_provider}`);
    console.log(`  - Max Prompts: ${nanoBanana.config.max_prompts}`);
    console.log(`  - Max Reference Images: ${nanoBanana.config.max_reference_images}`);
    console.log(`  - Cost per Image: $${nanoBanana.config.cost_per_image}`);
    console.log(`  - Supported Formats: ${nanoBanana.config.supported_formats.join(', ')}`);
    console.log(`  - Aspect Ratios: ${nanoBanana.config.aspect_ratios.join(', ')}`);
    console.log(`  - Requires API Key: ${nanoBanana.config.requires_api_key}`);
    console.log(`  - API Key Storage: ${nanoBanana.config.api_key_storage}`);
    console.log(`\nPricing:`);
    console.log(`  - Cost per Execution: $${nanoBanana.cost_per_execution}`);
    console.log(`  - Revenue per Execution: $${nanoBanana.revenue_per_execution}`);
    console.log(`  - Profit Margin: $${(nanoBanana.revenue_per_execution - nanoBanana.cost_per_execution).toFixed(2)} (${((nanoBanana.revenue_per_execution - nanoBanana.cost_per_execution) / nanoBanana.revenue_per_execution * 100).toFixed(1)}%)`);
    console.log(`\nTimestamps:`);
    console.log(`  - Created: ${new Date(nanoBanana.created_at).toLocaleString()}`);
    console.log(`  - Updated: ${new Date(nanoBanana.updated_at).toLocaleString()}`);
    console.log(`  - Deployed: ${nanoBanana.deployed_at ? new Date(nanoBanana.deployed_at).toLocaleString() : 'N/A'}`);
    console.log('\n' + '═'.repeat(100));

    // Check visibility
    console.log('\n✓ Verification Complete!\n');
    console.log('Visibility Checks:');
    console.log('  ✓ Workflow exists in database');
    console.log(`  ${nanoBanana.status === 'deployed' ? '✓' : '✗'} Status is "deployed" (required for visibility)`);
    console.log(`  ${nanoBanana.client_id ? '✓' : '✗'} Assigned to client`);
    console.log(`  ${nanoBanana.config.workflow_type === 'nano_banana' ? '✓' : '✗'} Workflow type is "nano_banana"`);
    console.log(`  ${nanoBanana.deployed_at ? '✓' : '✗'} Deployed timestamp is set`);

    if (nanoBanana.status === 'deployed' && nanoBanana.client_id && nanoBanana.deployed_at) {
      console.log('\n✅ The workflow should be visible to:');
      console.log(`   - Estee user (${nanoBanana.clients?.email})`);
      console.log('   - Admin users in the Workflows section');
    } else {
      console.log('\n⚠️  WARNING: The workflow may not be visible due to:');
      if (nanoBanana.status !== 'deployed') {
        console.log('   - Status is not "deployed"');
      }
      if (!nanoBanana.client_id) {
        console.log('   - No client assigned');
      }
      if (!nanoBanana.deployed_at) {
        console.log('   - No deployment timestamp');
      }
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  verifyNanoBananaWorkflow()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyNanoBananaWorkflow };
