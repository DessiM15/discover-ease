/**
 * Fix user references after syncing auth users
 * 
 * This script updates all foreign key references to use the new auth user IDs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserReferences() {
  console.log('🔧 Fixing user references...\n');

  try {
    // Get all auth users and map emails to IDs
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailToAuthId: Record<string, string> = {};
    
    authUsers?.users.forEach((user) => {
      if (user.email) {
        emailToAuthId[user.email] = user.id;
      }
    });

    // Get all database users
    const { data: dbUsers } = await supabase.from('users').select('id, email');

    if (!dbUsers) {
      console.log('No database users found');
      return;
    }

    // Create mapping from old ID to new ID
    const idMapping: Record<string, string> = {};
    
    for (const dbUser of dbUsers) {
      const authId = emailToAuthId[dbUser.email];
      if (authId && authId !== dbUser.id) {
        idMapping[dbUser.id] = authId;
      }
    }

    console.log(`Found ${Object.keys(idMapping).length} users to update references for\n`);

    // Update case_team
    console.log('Updating case_team...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error } = await supabase
        .from('case_team')
        .update({ user_id: newId })
        .eq('user_id', oldId);
      if (error) console.error(`  Error updating case_team for ${oldId}:`, error.message);
    }
    console.log('✅ case_team updated\n');

    // Update time_entries
    console.log('Updating time_entries...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error } = await supabase
        .from('time_entries')
        .update({ user_id: newId })
        .eq('user_id', oldId);
      if (error) console.error(`  Error updating time_entries for ${oldId}:`, error.message);
    }
    console.log('✅ time_entries updated\n');

    // Update documents
    console.log('Updating documents...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error } = await supabase
        .from('documents')
        .update({ uploaded_by_id: newId })
        .eq('uploaded_by_id', oldId);
      if (error && error.code !== 'PGRST116') {
        console.error(`  Error updating documents for ${oldId}:`, error.message);
      }
    }
    console.log('✅ documents updated\n');

    // Update discovery_requests
    console.log('Updating discovery_requests...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error } = await supabase
        .from('discovery_requests')
        .update({ assigned_to_id: newId })
        .eq('assigned_to_id', oldId);
      if (error && error.code !== 'PGRST116') {
        console.error(`  Error updating discovery_requests for ${oldId}:`, error.message);
      }
    }
    console.log('✅ discovery_requests updated\n');

    // Update events
    console.log('Updating events...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error } = await supabase
        .from('events')
        .update({ created_by_id: newId })
        .eq('created_by_id', oldId);
      if (error && error.code !== 'PGRST116') {
        console.error(`  Error updating events for ${oldId}:`, error.message);
      }
    }
    console.log('✅ events updated\n');

    // Update tasks
    console.log('Updating tasks...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error: error1 } = await supabase
        .from('tasks')
        .update({ assigned_to_id: newId })
        .eq('assigned_to_id', oldId);
      if (error1 && error1.code !== 'PGRST116') {
        console.error(`  Error updating tasks assigned_to for ${oldId}:`, error1.message);
      }

      const { error: error2 } = await supabase
        .from('tasks')
        .update({ created_by_id: newId })
        .eq('created_by_id', oldId);
      if (error2 && error2.code !== 'PGRST116') {
        console.error(`  Error updating tasks created_by for ${oldId}:`, error2.message);
      }
    }
    console.log('✅ tasks updated\n');

    // Update cases (lead_attorney_id)
    console.log('Updating cases...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const { error } = await supabase
        .from('cases')
        .update({ lead_attorney_id: newId })
        .eq('lead_attorney_id', oldId);
      if (error && error.code !== 'PGRST116') {
        console.error(`  Error updating cases for ${oldId}:`, error.message);
      }
    }
    console.log('✅ cases updated\n');

    console.log('✅ All user references updated!\n');
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixUserReferences();

