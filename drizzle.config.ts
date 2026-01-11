import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://momentique:momentique_dev_password@localhost:5432/momentique',
  },
  verbose: true,
  strict: true,
} satisfies Config;
