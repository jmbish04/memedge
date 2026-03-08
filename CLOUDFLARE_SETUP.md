# Cloudflare Workers Setup

This project has been retrofitted to run on Cloudflare Workers with:
- **Astro Islands** - Server-side rendering with interactive islands
- **Drizzle ORM** - Type-safe database access with D1
- **Shadcn UI** - Beautiful dark-themed UI components
- **TypeScript** - Full type safety with worker-configuration.d.ts

## Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Cloudflare account with Workers access

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npm run cf:create-db
```

This will create a D1 database named `memedge-db`. Copy the `database_id` from the output and update it in `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "memedge-db",
      "database_id": "YOUR_DATABASE_ID_HERE", // <-- Update this
      "migrations_dir": "drizzle/migrations"
    }
  ]
}
```

### 3. Generate TypeScript Types

After updating `wrangler.jsonc`, generate the worker configuration types:

```bash
npm run types
```

This runs `wrangler types` which generates `worker-configuration.d.ts` based on your bindings and compatibility settings.

**Important**: Run `npm run types` after any changes to `wrangler.jsonc` to keep types in sync.

### 4. Generate and Apply Database Migrations

Generate migration files from your Drizzle schema:

```bash
npm run db:generate
```

Apply migrations to your local D1 database:

```bash
npm run db:migrate:local
```

Apply migrations to your remote (production) D1 database:

```bash
npm run db:migrate:remote
```

### 5. Development

Start the development server:

```bash
npm run dev
```

This starts Wrangler in development mode with hot reload. Visit `http://localhost:8787`

For Astro development (SSR preview):

```bash
npm run dev:astro
```

## Database Management

### Drizzle Schema

The database schema is defined in `drizzle/schema.ts` using Drizzle ORM. It includes:

- `agent_memory` - Legacy KV-style memory
- `memory_blocks` - Letta-inspired structured memory
- `archival_memory` - Long-term storage
- `memory_embeddings` - Semantic search vectors
- `conversation_summaries_v2` - Recursive summaries

### Migration Workflow

1. **Update Schema**: Modify `drizzle/schema.ts`
2. **Generate Migration**: Run `npm run db:generate`
3. **Review Migration**: Check `drizzle/migrations/` for generated SQL
4. **Apply Locally**: Run `npm run db:migrate:local` (for testing)
5. **Apply Remote**: Run `npm run db:migrate:remote` (for production)

### Drizzle Studio

Launch Drizzle Studio to visually inspect and manage your database:

```bash
npm run db:studio
```

## Building and Deployment

### Build

Build both the library and Astro app:

```bash
npm run build
```

This runs:
1. `npm run build:lib` - Compiles TypeScript library to `dist/`
2. `npm run build:astro` - Builds Astro app with Cloudflare adapter

### Deploy

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

This builds and deploys your Worker to Cloudflare.

## Project Structure

```
memedge/
├── src/                       # TypeScript library source
│   ├── memory/               # Memory management
│   ├── summaries/            # Conversation summaries
│   ├── tools/                # LLM tool definitions
│   └── shared/               # Shared utilities
├── web/                       # Astro frontend
│   ├── pages/                # Astro pages
│   │   ├── index.astro      # Home page
│   │   ├── memories.astro   # Memories page
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn UI components
│   │   └── MemoryDashboard.tsx
│   ├── layouts/             # Astro layouts
│   ├── lib/                 # Utilities
│   └── styles/              # Global styles (Tailwind)
├── drizzle/                  # Database
│   ├── schema.ts            # Drizzle schema
│   └── migrations/          # SQL migrations
├── dist/                     # Build output (gitignored)
├── wrangler.jsonc           # Cloudflare Workers config
├── drizzle.config.ts        # Drizzle Kit config
├── astro.config.mjs         # Astro configuration
├── tailwind.config.mjs      # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── worker-configuration.d.ts # Generated worker types
```

## Configuration Files

### wrangler.jsonc

Main Cloudflare Workers configuration:
- D1 database bindings
- AI binding for embeddings
- Static assets configuration
- Compatibility flags

### drizzle.config.ts

Drizzle Kit configuration:
- Schema location
- Migrations directory
- D1 HTTP driver setup

### astro.config.mjs

Astro configuration:
- Cloudflare adapter
- React integration
- Tailwind CSS integration

## Environment Variables

Use `wrangler secret` for sensitive values:

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

Non-sensitive values can be set in `wrangler.jsonc` under `vars`.

## Shadcn UI Components

Dark theme is enabled by default. Add more components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

Components are configured in `components.json`.

## Astro Islands

Use `client:` directives to hydrate React components:

```astro
<MemoryDashboard client:load />     <!-- Loads immediately -->
<MemoryDashboard client:visible />  <!-- Loads when visible -->
<MemoryDashboard client:idle />     <!-- Loads when idle -->
```

## API Routes

API routes are defined in `web/pages/api/` and automatically use Drizzle + D1:

```typescript
// web/pages/api/memories.ts
import { drizzle } from 'drizzle-orm/d1';
import { memoryBlocks } from '../../../drizzle/schema';

export const GET: APIRoute = async ({ locals }) => {
  const db = drizzle(locals.runtime.env.DB);
  const blocks = await db.select().from(memoryBlocks);
  return new Response(JSON.stringify({ blocks }));
};
```

## Important Notes

### Worker Configuration Types

Always run `npm run types` after modifying `wrangler.jsonc`. This ensures TypeScript knows about your bindings.

### D1 Migrations

- Use `--local` for development
- Use `--remote` for production
- Migrations are applied sequentially
- Failed migrations are rolled back automatically

### Drizzle ORM

The project uses `drizzle-orm/d1` driver for D1 database access. All queries are type-safe based on your schema.

## Troubleshooting

### "DB is not defined"

Run `npm run types` to regenerate worker configuration types.

### "Migration failed"

Check `drizzle/migrations/` for SQL syntax errors. You can manually edit migration files if needed.

### Astro build errors

Ensure all dependencies are installed and `astro check` passes.

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Drizzle ORM D1 Guide](https://developers.cloudflare.com/d1/tutorials/d1-and-drizzle-orm/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
