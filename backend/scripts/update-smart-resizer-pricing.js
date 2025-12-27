const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePricing() {
  console.log('🔧 Updating Smart Resizer workflow pricing configuration...');
  
  const { data: workflow, error: fetchError } = await supabase
    .from('workflows')
    .select('*')
    .eq('name', 'Smart Resizer')
    .single();
  
  if (fetchError) {
    console.error('❌ Error fetching workflow:', fetchError);
    process.exit(1);
  }
  
  console.log('📋 Current config:', JSON.stringify(workflow.config, null, 2));
  
  const updatedConfig = {
    ...workflow.config,
    pricing: {
      ...workflow.config.pricing,
      per_format: {
        cost_per_format: 0.001,
        revenue_per_format: 0.01
      }
    }
  };
  
  const { data, error } = await supabase
    .from('workflows')
    .update({ 
      config: updatedConfig,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Smart Resizer')
    .select();
  
  if (error) {
    console.error('❌ Error updating workflow:', error);
    process.exit(1);
  }
  
  console.log('✅ Workflow pricing updated successfully');
  console.log('📋 New config:', JSON.stringify(updatedConfig, null, 2));
  process.exit(0);
}

updatePricing();
