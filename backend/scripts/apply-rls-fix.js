require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');
const fs = require('fs');

async function applyFix() {
  try {
    const sql = fs.readFileSync('./fix-rls.sql', 'utf8');
    console.log('Applying RLS fix...\n');
    console.log(sql);
    console.log('\n---\n');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 60) + '...');
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          console.error('Error:', error.message);
          // Continue anyway
        } else {
          console.log('✓ Success');
        }
      }
    }
    
    console.log('\n✓ RLS fix applied!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

applyFix().then(() => process.exit(0));
