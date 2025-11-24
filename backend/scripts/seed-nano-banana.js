/**
 * Seed Image Factory Workflow Script
 * Creates the "Image Factory" workflow for Estee client
 */

const { supabaseAdmin } = require('../src/config/database');
require('dotenv').config();

async function seedNanoBananaWorkflow() {
  console.log('Starting Image Factory workflow seeding...\n');

  try {
    // Step 1: Find Estee client
    console.log('Step 1: Finding Estee client...');
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, name')
      .or('email.eq.estee@masstock.com,email.eq.contact@estee-agency.com');

    if (clientError) {
      throw new Error(`Error querying clients: ${clientError.message}`);
    }

    if (!clients || clients.length === 0) {
      console.error('ERROR: Estee client not found!');
      console.log('\nSearching for all clients with "estee" in email or name...');

      const { data: allClients, error: searchError } = await supabaseAdmin
        .from('clients')
        .select('id, email, name')
        .or('email.ilike.%estee%,name.ilike.%estee%');

      if (searchError) {
        throw new Error(`Error searching clients: ${searchError.message}`);
      }

      if (allClients && allClients.length > 0) {
        console.log('\nFound clients matching "estee":');
        allClients.forEach(client => {
          console.log(`  - ID: ${client.id}, Email: ${client.email}, Name: ${client.name}`);
        });
        console.log('\nPlease update the script with the correct email or create Estee client.');
      } else {
        console.log('\nNo clients found matching "estee". Please create Estee client first.');
      }

      return;
    }

    const esteeClient = clients[0];
    console.log(`✓ Found Estee client:`);
    console.log(`  - ID: ${esteeClient.id}`);
    console.log(`  - Email: ${esteeClient.email}`);
    console.log(`  - Name: ${esteeClient.name}\n`);

    // Step 2: Check if workflow already exists
    console.log('Step 2: Checking if workflow already exists...');
    const { data: existingWorkflows, error: workflowCheckError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, status, client_id')
      .eq('client_id', esteeClient.id)
      .eq('name', 'Image Factory');

    if (workflowCheckError) {
      throw new Error(`Error checking workflows: ${workflowCheckError.message}`);
    }

    if (existingWorkflows && existingWorkflows.length > 0) {
      const existing = existingWorkflows[0];
      console.log(`ℹ Workflow already exists:`);
      console.log(`  - ID: ${existing.id}`);
      console.log(`  - Name: ${existing.name}`);
      console.log(`  - Status: ${existing.status}`);
      console.log(`  - Client ID: ${existing.client_id}\n`);

      if (existing.status !== 'deployed') {
        console.log('WARNING: Workflow exists but status is not "deployed"');
        console.log('Updating status to "deployed"...');

        const { error: updateError } = await supabaseAdmin
          .from('workflows')
          .update({
            status: 'deployed',
            deployed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          throw new Error(`Error updating workflow status: ${updateError.message}`);
        }

        console.log('✓ Workflow status updated to "deployed"\n');
      } else {
        console.log('Workflow is already deployed. No action needed.\n');
      }

      return;
    }

    console.log('✓ Workflow does not exist. Proceeding with creation...\n');

    // Step 3: Create the workflow
    console.log('Step 3: Creating Image Factory workflow...');

    const workflowData = {
      client_id: esteeClient.id,
      name: 'Image Factory',
      description: 'Transformez vos idées en images. Production en masse jusqu\'à 10 000 générations par batch.',
      status: 'deployed',
      config: {
        workflow_type: 'nano_banana',
        api_provider: 'google_gemini',
        available_models: ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'],
        default_model: 'gemini-2.5-flash-image',
        max_prompts: 10000,
        max_reference_images: 3,
        supported_formats: ['png', 'jpg', 'webp'],
        aspect_ratios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
        default_aspect_ratio: '1:1',
        available_resolutions: {
          flash: ['1K'],
          pro: ['1K', '2K', '4K']
        },
        default_resolution: {
          flash: '1K',
          pro: '1K'
        },
        pricing: {
          flash: {
            cost_per_image: 0.039,
            revenue_per_image: 0.10
          },
          pro: {
            '1K': {
              cost_per_image: 0.03633,
              revenue_per_image: 0.10
            },
            '2K': {
              cost_per_image: 0.03633,
              revenue_per_image: 0.10
            },
            '4K': {
              cost_per_image: 0.06,
              revenue_per_image: 0.15
            }
          }
        },
        requires_api_key: true,
        api_key_storage: 'encrypted_ephemeral'
      },
      cost_per_execution: 0.039,
      revenue_per_execution: 0.10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deployed_at: new Date().toISOString()
    };

    const { data: newWorkflow, error: insertError } = await supabaseAdmin
      .from('workflows')
      .insert([workflowData])
      .select();

    if (insertError) {
      throw new Error(`Error inserting workflow: ${insertError.message}`);
    }

    console.log('✓ Workflow created successfully!\n');

    // Step 4: Verify the insertion
    console.log('Step 4: Verifying workflow creation...');
    const { data: verifyWorkflow, error: verifyError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, client_id, status, config, cost_per_execution, revenue_per_execution')
      .eq('name', 'Image Factory')
      .eq('client_id', esteeClient.id)
      .single();

    if (verifyError) {
      throw new Error(`Error verifying workflow: ${verifyError.message}`);
    }

    console.log('✓ Workflow verified in database:');
    console.log(`  - ID: ${verifyWorkflow.id}`);
    console.log(`  - Name: ${verifyWorkflow.name}`);
    console.log(`  - Client ID: ${verifyWorkflow.client_id}`);
    console.log(`  - Status: ${verifyWorkflow.status}`);
    console.log(`  - Workflow Type: ${verifyWorkflow.config.workflow_type}`);
    console.log(`  - Cost per Execution: $${verifyWorkflow.cost_per_execution}`);
    console.log(`  - Revenue per Execution: $${verifyWorkflow.revenue_per_execution}\n`);

    console.log('═'.repeat(60));
    console.log('SUCCESS! Image Factory workflow has been created.');
    console.log('═'.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Log in as Estee user: contact@estee-agency.com');
    console.log('2. Navigate to Workflows page');
    console.log('3. Verify "Image Factory" appears in the list');
    console.log('4. Admin should also see it in Admin > Workflows\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  seedNanoBananaWorkflow()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedNanoBananaWorkflow };
