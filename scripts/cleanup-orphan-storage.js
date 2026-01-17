#!/usr/bin/env node
/**
 * Cleanup Orphan Storage Files
 *
 * Identifies and removes files in Supabase Storage that are no longer
 * referenced in the database.
 *
 * Usage:
 *   node scripts/cleanup-orphan-storage.js          # Dry run
 *   node scripts/cleanup-orphan-storage.js --delete # Actually delete
 */

// Load environment variables from backend/.env
require('../backend/node_modules/dotenv').config({ path: './backend/.env' });

const { supabaseAdmin } = require('../backend/dist/config/database');

// Estee's execution IDs to protect (never delete)
const ESTEE_CLIENT_ID = 'a76e631c-4dc4-4abc-b759-9f7c225c142b';
const ESTEE_PROTECTED_FOLDERS = [
  '13ffe5ca-fea9-42e4-816b-15d6e507bc6d',
  '64e12d9d-c146-474d-9fc5-30554bb50937',
  '3e420bd0-3d19-4969-ba25-aa6f9468f974',
];

/**
 * Recursively list all files in a storage folder
 */
async function listAllStorageFiles(bucket, path = '') {
  const allFiles = [];

  try {
    const { data: items, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error(`❌ Error listing path '${path}':`, error.message);
      return allFiles;
    }

    if (!items || items.length === 0) {
      return allFiles;
    }

    for (const item of items) {
      const fullPath = path ? `${path}/${item.name}` : item.name;

      // If it's a folder (no id means it's a folder in Supabase Storage)
      if (!item.id) {
        // Recursively list files in this folder
        const subFiles = await listAllStorageFiles(bucket, fullPath);
        allFiles.push(...subFiles);
      } else {
        // It's a file
        allFiles.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`❌ Exception listing path '${path}':`, err.message);
  }

  return allFiles;
}

/**
 * Get all file paths referenced in the database
 */
async function getReferencedPaths() {
  const referencedPaths = new Set();

  try {
    // Get paths from workflow_batch_results
    const { data: workflowResults, error: error1 } = await supabaseAdmin
      .from('workflow_batch_results')
      .select('result_storage_path')
      .not('result_storage_path', 'is', null);

    if (error1) {
      console.error('❌ Error fetching workflow_batch_results:', error1.message);
    } else if (workflowResults) {
      workflowResults.forEach((row) => {
        if (row.result_storage_path) {
          referencedPaths.add(row.result_storage_path);
        }
      });
    }

    // Get paths from smart_resizer_jobs
    const { data: smartJobs, error: error2 } = await supabaseAdmin
      .from('smart_resizer_jobs')
      .select('master_storage_path')
      .not('master_storage_path', 'is', null);

    if (error2) {
      console.error('❌ Error fetching smart_resizer_jobs:', error2.message);
    } else if (smartJobs) {
      smartJobs.forEach((row) => {
        if (row.master_storage_path) {
          referencedPaths.add(row.master_storage_path);
        }
      });
    }

    // Get paths from smart_resizer_results
    const { data: smartResults, error: error3 } = await supabaseAdmin
      .from('smart_resizer_results')
      .select('storage_path')
      .not('storage_path', 'is', null);

    if (error3) {
      console.error('❌ Error fetching smart_resizer_results:', error3.message);
    } else if (smartResults) {
      smartResults.forEach((row) => {
        if (row.storage_path) {
          referencedPaths.add(row.storage_path);
        }
      });
    }
  } catch (err) {
    console.error('❌ Exception fetching referenced paths:', err.message);
  }

  return referencedPaths;
}

/**
 * Check if a file path belongs to Estee (protected)
 */
function isEsteeFile(filePath) {
  return ESTEE_PROTECTED_FOLDERS.some((folder) => filePath.startsWith(folder));
}

/**
 * Delete files from storage
 */
async function deleteFiles(bucket, files) {
  let deletedCount = 0;

  // Delete in batches of 100 (Supabase limit)
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(batch);

    if (error) {
      console.error(`❌ Error deleting batch ${Math.floor(i / 100) + 1}:`, error.message);
    } else {
      deletedCount += batch.length;
      console.log(`✅ Deleted batch ${Math.floor(i / 100) + 1}: ${batch.length} files`);
    }
  }

  return deletedCount;
}

/**
 * Main cleanup function
 */
async function main() {
  const deleteMode = process.argv.includes('--delete');
  const bucket = 'workflow-results';

  console.log('\n=== Cleanup Orphan Storage Files ===\n');
  console.log(`Mode: ${deleteMode ? '🗑️  DELETE' : '🔍 DRY RUN'}\n`);

  // Step 1: List all files in storage
  console.log('📂 Scanning storage bucket "workflow-results"...');
  const storageFiles = await listAllStorageFiles(bucket);
  console.log(`✅ Found ${storageFiles.length} files in storage\n`);

  // Step 2: Get all referenced paths from database
  console.log('🔍 Fetching referenced paths from database...');
  const referencedPaths = await getReferencedPaths();
  console.log(`✅ Found ${referencedPaths.size} referenced paths\n`);

  // Step 3: Identify orphan files
  console.log('🔎 Identifying orphan files...');
  const orphanFiles = [];
  const protectedFiles = [];

  for (const file of storageFiles) {
    // Check if file belongs to Estee (protected)
    if (isEsteeFile(file)) {
      protectedFiles.push(file);
      continue;
    }

    // Check if file is referenced in database
    if (!referencedPaths.has(file)) {
      orphanFiles.push(file);
    }
  }

  console.log(`✅ Found ${orphanFiles.length} orphan files\n`);

  // Step 4: Display protected files (Estee)
  if (protectedFiles.length > 0) {
    console.log('🛡️  Protected files (Estee):');
    const groupedByFolder = {};
    protectedFiles.forEach((file) => {
      const folder = file.split('/')[0];
      groupedByFolder[folder] = (groupedByFolder[folder] || 0) + 1;
    });

    Object.entries(groupedByFolder).forEach(([folder, count]) => {
      console.log(`  - ${folder}/ (${count} files) [PROTECTED]`);
    });
    console.log('');
  }

  // Step 5: Display orphan files (sample)
  if (orphanFiles.length > 0) {
    console.log('🗑️  Orphan files to delete (sample):');
    orphanFiles.slice(0, 20).forEach((file) => {
      console.log(`  - ${file}`);
    });
    if (orphanFiles.length > 20) {
      console.log(`  ... and ${orphanFiles.length - 20} more`);
    }
    console.log('');
  }

  // Step 6: Delete or show summary
  if (deleteMode) {
    if (orphanFiles.length === 0) {
      console.log('✅ No orphan files to delete!\n');
      return;
    }

    console.log(`⚠️  About to delete ${orphanFiles.length} files...`);
    console.log('⏳ Starting deletion...\n');

    const deletedCount = await deleteFiles(bucket, orphanFiles);

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} files\n`);
  } else {
    console.log(`[DRY RUN] Would delete ${orphanFiles.length} files`);
    console.log('Run with --delete flag to actually remove files\n');
  }

  // Step 7: Summary
  console.log('=== Summary ===');
  console.log(`Total files in storage: ${storageFiles.length}`);
  console.log(`Referenced in database: ${referencedPaths.size}`);
  console.log(`Protected (Estee): ${protectedFiles.length}`);
  console.log(`Orphan files: ${orphanFiles.length}`);
  if (deleteMode) {
    console.log(`Deleted: ${orphanFiles.length}`);
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
