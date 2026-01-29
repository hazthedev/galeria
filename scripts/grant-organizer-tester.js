// Grant tester tier to the organizer test account.
// Usage: node scripts/grant-organizer-tester.js

const { Client } = require('pg');

const EMAIL = 'organizer@gmail.com';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const result = await client.query(
      `UPDATE users
       SET subscription_tier = 'tester',
           updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, subscription_tier`,
      [EMAIL]
    );

    if (result.rowCount === 0) {
      console.log(`[grant-organizer-tester] No user found for ${EMAIL}`);
      return;
    }

    console.log('[grant-organizer-tester] Updated user:', result.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[grant-organizer-tester] Failed:', error.message);
  process.exitCode = 1;
});
