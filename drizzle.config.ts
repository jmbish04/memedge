import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    // For local development, Drizzle Kit will use wrangler.jsonc configuration
    // For production, set via environment variables:
    // CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_DATABASE_ID
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || '',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
});
