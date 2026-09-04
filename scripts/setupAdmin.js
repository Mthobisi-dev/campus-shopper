const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local natively
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function setupAdmin() {
  const email = 'mthobisimzimela031@gmail.com';
  const password = 'Mthobisi890!';

  console.log(`Setting up admin user for ${email}...`);

  // Check if user already exists
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  let user = users ? users.find((u) => u.email === email) : null;

  if (!user) {
    console.log('User not found. Creating user in Supabase Auth...');
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'Campus Administrator' },
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }
    user = created.user;
    console.log(`Created Supabase Auth user: ${user.id}`);
  } else {
    console.log(`Found existing user: ${user.id}. Updating password...`);
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      console.error('Error updating password:', updateError.message);
    }
  }

  // Ensure user is in profiles table
  await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    display_name: 'Campus Administrator',
    university: 'Durban University of Technology',
    suburb: 'Glenwood',
    monthly_budget_zar: 1500,
    budget_reset_day: 1,
  }, { onConflict: 'id' });

  // Ensure user is in admins table
  const { error: adminInsertError } = await supabaseAdmin.from('admins').upsert({
    id: user.id,
    display_name: 'Campus Administrator',
  }, { onConflict: 'id' });

  if (adminInsertError) {
    console.error('Error inserting into admins table:', adminInsertError.message);
  } else {
    console.log('Successfully added user to public.admins table!');
  }

  console.log('Admin setup complete!');
}

setupAdmin().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
