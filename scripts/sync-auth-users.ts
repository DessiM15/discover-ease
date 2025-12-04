/**
 * Sync Supabase Auth users with database users
 * 
 * This script links Supabase Auth users to the seeded database user records
 * by matching email addresses and updating the database user IDs.
 * 
 * Run with: npx tsx scripts/sync-auth-users.ts
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

// Email to expected user ID mapping from seed script
const USER_EMAILS_TO_IDS = {
  'sarah@mitchelllaw.com': '550e8400-e29b-41d4-a716-446655440001',
  'david@mitchelllaw.com': '550e8400-e29b-41d4-a716-446655440002',
  'maria@mitchelllaw.com': '550e8400-e29b-41d4-a716-446655440003',
  'jennifer@mitchelllaw.com': '550e8400-e29b-41d4-a716-446655440004',
  'michael@mitchelllaw.com': '550e8400-e29b-41d4-a716-446655440005',
};

async function syncAuthUsers() {
  console.log('🔄 Syncing Supabase Auth users with database users...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      throw authError;
    }

    if (!authUsers || authUsers.users.length === 0) {
      console.log('⚠️  No auth users found. Please create users in Supabase Auth first.');
      return;
    }

    console.log(`Found ${authUsers.users.length} auth users\n`);

    // For each auth user, update the database user record
    for (const authUser of authUsers.users) {
      const email = authUser.email;
      if (!email) continue;

      const expectedId = USER_EMAILS_TO_IDS[email as keyof typeof USER_EMAILS_TO_IDS];

      if (!expectedId) {
        console.log(`⚠️  No matching database user for ${email}`);
        continue;
      }

      // Check if database user exists with expected ID
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', expectedId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        // Update the database user ID to match the auth user ID
        console.log(`Updating user ${email}...`);
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: authUser.id })
          .eq('id', expectedId);

        if (updateError) {
          // If update fails (e.g., foreign key constraint), try deleting and recreating
          console.log(`  Update failed, trying to recreate user record...`);
          
          // Get the user data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', expectedId)
            .single();

          if (userData) {
            // Delete old record
            await supabase.from('users').delete().eq('id', expectedId);

            // Create new record with auth user ID
            const { error: insertError } = await supabase.from('users').insert({
              ...userData,
              id: authUser.id,
            });

            if (insertError) {
              console.error(`  ❌ Failed to recreate user: ${insertError.message}`);
            } else {
              console.log(`  ✅ User record updated successfully`);
            }
          }
        } else {
          console.log(`  ✅ User ID updated to ${authUser.id}`);
        }
      } else {
        // User doesn't exist, create it
        console.log(`Creating new user record for ${email}...`);
        
        // Get firm ID
        const { data: firm } = await supabase
          .from('firms')
          .select('id')
          .eq('email', 'info@mitchelllaw.com')
          .single();

        if (!firm) {
          console.error(`  ❌ Firm not found`);
          continue;
        }

        // Determine user details based on email
        const userDetails: any = {
          id: authUser.id,
          firm_id: firm.id,
          email: email,
          is_active: true,
        };

        if (email === 'sarah@mitchelllaw.com') {
          Object.assign(userDetails, {
            first_name: 'Sarah',
            last_name: 'Mitchell',
            role: 'owner',
            title: 'Managing Partner',
            billing_rate: '450.00',
          });
        } else if (email === 'david@mitchelllaw.com') {
          Object.assign(userDetails, {
            first_name: 'David',
            last_name: 'Chen',
            role: 'attorney',
            title: 'Senior Associate',
            billing_rate: '350.00',
          });
        } else if (email === 'maria@mitchelllaw.com') {
          Object.assign(userDetails, {
            first_name: 'Maria',
            last_name: 'Rodriguez',
            role: 'attorney',
            title: 'Associate',
            billing_rate: '275.00',
          });
        } else if (email === 'jennifer@mitchelllaw.com') {
          Object.assign(userDetails, {
            first_name: 'Jennifer',
            last_name: 'Park',
            role: 'paralegal',
            title: 'Paralegal',
            billing_rate: '150.00',
          });
        } else if (email === 'michael@mitchelllaw.com') {
          Object.assign(userDetails, {
            first_name: 'Michael',
            last_name: 'Thompson',
            role: 'secretary',
            title: 'Legal Secretary',
            billing_rate: '95.00',
          });
        }

        const { error: insertError } = await supabase.from('users').insert(userDetails);

        if (insertError) {
          console.error(`  ❌ Failed to create user: ${insertError.message}`);
        } else {
          console.log(`  ✅ User record created successfully`);
        }
      }
    }

    console.log('\n✅ Sync completed!\n');
    console.log('You can now log in with any of these users:');
    authUsers.users.forEach((user) => {
      if (user.email) {
        console.log(`- ${user.email}`);
      }
    });
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncAuthUsers();

