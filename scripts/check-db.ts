// Quick script to check current database state

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

async function checkDb() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // Check tenants
    const tenants = await client.query('SELECT id, tenant_type, brand_name, subdomain FROM tenants');
    console.log('Tenants:', tenants.rows);

    // Check users
    const users = await client.query('SELECT id, email, name, role, tenant_id FROM users');
    console.log('Users:', users.rows);

    // Check events
    const events = await client.query('SELECT id, name, tenant_id, organizer_id FROM events');
    console.log('Events:', events.rows);

  } finally {
    client.release();
    await pool.end();
  }
}

checkDb().then(() => process.exit(0));
