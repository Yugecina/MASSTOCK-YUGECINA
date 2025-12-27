/**
 * Get execution report for Smart Resizer workflow
 * Usage: node scripts/get-execution-report.js <execution_id>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getExecutionReport(executionId) {
  try {
    console.log('\n📊 Rapport d\'exécution Smart Resizer\n');
    console.log('Execution ID:', executionId);
    console.log('='.repeat(80));

    // Get execution details
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (execError) {
      console.error('❌ Erreur récupération exécution:', execError.message);
      return;
    }

    console.log('\n1️⃣  DÉTAILS EXÉCUTION');
    console.log('-'.repeat(80));
    console.log('Workflow ID:', execution.workflow_id);
    console.log('Status:', execution.status);
    console.log('Démarré:', new Date(execution.created_at).toLocaleString('fr-FR'));
    console.log('Terminé:', execution.completed_at ? new Date(execution.completed_at).toLocaleString('fr-FR') : 'En cours');

    const config = execution.workflow_config || {};
    console.log('\n📋 Configuration:');
    console.log('  - Formats demandés:', config.formats_requested?.join(', ') || 'N/A');
    console.log('  - Nombre d\'images:', config.uploaded_images?.length || 0);
    if (config.uploaded_images) {
      config.uploaded_images.forEach((img, i) => {
        console.log(`  - Image ${i + 1}:`, img.name);
      });
    }

    // Get batch results
    const { data: batchResults, error: batchError } = await supabase
      .from('workflow_batch_results')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (batchError) {
      console.error('❌ Erreur récupération batch results:', batchError.message);
      return;
    }

    console.log('\n2️⃣  RÉSULTATS PAR FORMAT');
    console.log('-'.repeat(80));
    console.log(`Total: ${batchResults.length} formats générés\n`);

    batchResults.forEach((result, i) => {
      const status = result.status === 'completed' ? '✅' : result.status === 'failed' ? '❌' : '⏳';
      console.log(`${status} Format ${i + 1}: ${result.format_name} (${result.format_key})`);
      console.log(`   Méthode: ${result.processing_method || 'N/A'}`);
      console.log(`   Temps: ${result.processing_time_ms ? (result.processing_time_ms / 1000).toFixed(2) + 's' : 'N/A'}`);
      console.log(`   Statut: ${result.status}`);

      if (result.metadata) {
        const meta = result.metadata;
        if (meta.dimensions) {
          console.log(`   Dimensions: ${meta.dimensions.width}x${meta.dimensions.height}`);
        }
        if (meta.ai_generation) {
          console.log(`   IA: Modèle ${meta.ai_generation.model || 'N/A'}`);
        }
        if (meta.ocr_analysis) {
          console.log(`   OCR: ${meta.ocr_analysis.text_count || 0} textes détectés`);
        }
      }

      if (result.error_message) {
        console.log(`   ❌ Erreur: ${result.error_message}`);
      }

      if (result.result_url) {
        console.log(`   🔗 URL: ${result.result_url}`);
      }
      console.log('');
    });

    // Get stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_execution_stats', { exec_id: executionId });

    if (!statsError && stats && stats.length > 0) {
      const stat = stats[0];
      console.log('3️⃣  STATISTIQUES');
      console.log('-'.repeat(80));
      console.log('Taux de réussite:', stat.completion_percentage + '%');
      console.log('Succès:', stat.successful);
      console.log('Échecs:', stat.failed);
      console.log('Temps moyen:', (stat.avg_processing_time_ms / 1000).toFixed(2) + 's');
      console.log('Coût total:', '$' + stat.total_cost.toFixed(4));
      console.log('Prompts utilisés:', stat.total_prompts);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Rapport généré avec succès\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

// Get execution ID from command line
const executionId = process.argv[2];

if (!executionId) {
  console.error('Usage: node scripts/get-execution-report.js <execution_id>');
  process.exit(1);
}

getExecutionReport(executionId);
