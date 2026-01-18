#!/usr/bin/env node
/**
 * Cleanup Old Executions
 *
 * Deletes old workflow executions (database + storage files)
 * while protecting Estee's data.
 *
 * Usage:
 *   node scripts/cleanup-old-executions.js                    # Dry run (see what would be deleted)
 *   node scripts/cleanup-old-executions.js --before 2025-12-20 # Delete executions before date
 *   node scripts/cleanup-old-executions.js --delete            # Actually delete (after dry run)
 */

// Load environment variables from backend/.env
require('../backend/node_modules/dotenv').config({ path: './backend/.env' });

const { supabaseAdmin } = require('../backend/dist/config/database');

// Estee's client ID to protect (never delete)
const ESTEE_CLIENT_ID = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';

// Default: delete executions before this date
const DEFAULT_BEFORE_DATE = '2025-12-19'; // Keep last 4 weeks

/**
 * Get executions to delete
 */
async function getExecutionsToDelete(beforeDate) {
  try {
    const { data: executions, error } = await supabaseAdmin
      .from('workflow_executions')
      .select(`
        id,
        created_at,
        status,
        client_id,
        clients!inner(name)
      `)
      .neq('client_id', ESTEE_CLIENT_ID) // Exclude Estee
      .lt('created_at', beforeDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching executions:', error.message);
      return [];
    }

    return executions || [];
  } catch (err) {
    console.error('❌ Exception fetching executions:', err.message);
    return [];
  }
}

/**
 * Get storage files for executions
 */
async function getStorageFilesForExecutions(executionIds) {
  if (executionIds.length === 0) return [];

  try {
    const { data: batchResults, error } = await supabaseAdmin
      .from('workflow_batch_results')
      .select('result_storage_path, execution_id')
      .in('execution_id', executionIds)
      .not('result_storage_path', 'is', null);

    if (error) {
      console.error('❌ Error fetching storage paths:', error.message);
      return [];
    }

    return (batchResults || []).map(r => r.result_storage_path);
  } catch (err) {
    console.error('❌ Exception fetching storage paths:', err.message);
    return [];
  }
}

/**
 * Delete files from storage
 */
async function deleteStorageFiles(files) {
  if (files.length === 0) return 0;

  let deletedCount = 0;
  const bucket = 'workflow-results';

  // Delete in batches of 100 (Supabase limit)
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(batch);

    if (error) {
      console.error(`❌ Error deleting storage batch ${Math.floor(i / 100) + 1}:`, error.message);
    } else {
      deletedCount += batch.length;
      console.log(`✅ Deleted storage batch ${Math.floor(i / 100) + 1}: ${batch.length} files`);
    }
  }

  return deletedCount;
}

/**
 * Delete executions from database (CASCADE will delete batch_results)
 */
async function deleteExecutionsFromDB(executionIds) {
  if (executionIds.length === 0) return 0;

  try {
    // Delete in batches of 100
    let totalDeleted = 0;

    for (let i = 0; i < executionIds.length; i += 100) {
      const batch = executionIds.slice(i, i + 100);

      const { error } = await supabaseAdmin
        .from('workflow_executions')
        .delete()
        .in('id', batch)
        .neq('client_id', ESTEE_CLIENT_ID); // Extra safety

      if (error) {
        console.error(`❌ Error deleting DB batch ${Math.floor(i / 100) + 1}:`, error.message);
      } else {
        totalDeleted += batch.length;
        console.log(`✅ Deleted DB batch ${Math.floor(i / 100) + 1}: ${batch.length} executions`);
      }
    }

    return totalDeleted;
  } catch (err) {
    console.error('❌ Exception deleting executions:', err.message);
    return 0;
  }
}

/**
 * Main cleanup function
 */
async function main() {
  const args = process.argv.slice(2);
  const deleteMode = args.includes('--delete');

  // Parse --before date
  let beforeDate = DEFAULT_BEFORE_DATE;
  const beforeIndex = args.indexOf('--before');
  if (beforeIndex !== -1 && args[beforeIndex + 1]) {
    beforeDate = args[beforeIndex + 1];
  }

  console.log('\n=== Cleanup Old Executions ===\n');
  console.log(`Mode: ${deleteMode ? '🗑️  DELETE' : '🔍 DRY RUN'}`);
  console.log(`Delete executions before: ${beforeDate}`);
  console.log(`Protected client: Estee (${ESTEE_CLIENT_ID})\n`);

  // Step 1: Get executions to delete
  console.log('📂 Fetching executions to delete...');
  const executions = await getExecutionsToDelete(beforeDate);
  console.log(`✅ Found ${executions.length} executions to delete\n`);

  if (executions.length === 0) {
    console.log('✅ No executions to delete!\n');
    return;
  }

  // Step 2: Get storage files
  const executionIds = executions.map(e => e.id);
  console.log('📂 Fetching storage files...');
  const storageFiles = await getStorageFilesForExecutions(executionIds);
  console.log(`✅ Found ${storageFiles.length} storage files to delete\n`);

  // Step 3: Display summary
  console.log('📊 Summary of executions to delete:');

  // Group by client
  const byClient = {};
  executions.forEach(exec => {
    const clientName = exec.clients?.name || 'Unknown';
    if (!byClient[clientName]) {
      byClient[clientName] = { count: 0, oldest: exec.created_at, newest: exec.created_at };
    }
    byClient[clientName].count++;
    if (exec.created_at < byClient[clientName].oldest) byClient[clientName].oldest = exec.created_at;
    if (exec.created_at > byClient[clientName].newest) byClient[clientName].newest = exec.created_at;
  });

  Object.entries(byClient).forEach(([client, stats]) => {
    console.log(`  - ${client}: ${stats.count} executions (${stats.oldest.split('T')[0]} to ${stats.newest.split('T')[0]})`);
  });
  console.log('');

  // Step 4: Show sample
  console.log('📝 Sample executions (first 10):');
  executions.slice(0, 10).forEach(exec => {
    const date = exec.created_at.split('T')[0];
    const clientName = exec.clients?.name || 'Unknown';
    console.log(`  - ${date} | ${clientName} | ${exec.status} | ${exec.id}`);
  });
  if (executions.length > 10) {
    console.log(`  ... and ${executions.length - 10} more`);
  }
  console.log('');

  // Step 5: Delete or show dry run
  if (deleteMode) {
    console.log('⚠️  Starting deletion...\n');

    // Delete storage files first
    console.log('🗑️  Deleting storage files...');
    const deletedFiles = await deleteStorageFiles(storageFiles);
    console.log(`✅ Deleted ${deletedFiles} storage files\n`);

    // Delete database records
    console.log('🗑️  Deleting database records...');
    const deletedExecutions = await deleteExecutionsFromDB(executionIds);
    console.log(`✅ Deleted ${deletedExecutions} executions\n`);

    console.log('✅ Cleanup complete!\n');
  } else {
    console.log('[DRY RUN] Would delete:');
    console.log(`  - ${executions.length} executions from database`);
    console.log(`  - ${storageFiles.length} files from storage`);
    console.log('\nRun with --delete flag to actually remove them\n');
  }

  // Step 6: Final summary
  console.log('=== Final Summary ===');
  console.log(`Executions to delete: ${executions.length}`);
  console.log(`Storage files to delete: ${storageFiles.length}`);
  console.log(`Protected (Estee): YES ✅`);
  if (deleteMode) {
    console.log(`Status: DELETED`);
  } else {
    console.log(`Status: DRY RUN (use --delete to execute)`);
  }
  console.log('');
}

// Run main function
main()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
