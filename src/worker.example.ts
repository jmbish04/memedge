/**
 * Example Cloudflare Worker using Memedge with Drizzle ORM
 *
 * This demonstrates how to use the Memedge library in a Cloudflare Worker
 * with proper D1 integration via Drizzle ORM.
 */

import { Effect, Layer } from 'effect';
import { drizzle } from 'drizzle-orm/d1';
import {
  DrizzleMemoryService,
  DrizzleMemoryServiceLive,
  D1Context,
} from './integration/drizzle';
import { memoryBlocks } from '../drizzle/schema';

export interface Env {
  DB: D1Database;
  AI: Ai;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
}

/**
 * Main worker export
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx);
    }

    // Serve Astro assets
    return env.ASSETS.fetch(request);
  },
};

/**
 * API request handler
 */
async function handleApi(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);

  try {
    // Route: GET /api/health
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /api/memories
    if (url.pathname === '/api/memories' && request.method === 'GET') {
      return await getMemories(env);
    }

    // Route: POST /api/memories
    if (url.pathname === '/api/memories' && request.method === 'POST') {
      return await createMemory(request, env);
    }

    // Route: GET /api/memories/search
    if (url.pathname === '/api/memories/search' && request.method === 'GET') {
      const query = url.searchParams.get('q') || '';
      return await searchMemories(query, env);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/memories - Fetch all memory blocks
 */
async function getMemories(env: Env): Promise<Response> {
  const program = Effect.gen(function* () {
    const service = yield* DrizzleMemoryService;
    const blocks = yield* service.getMemoryBlocks();
    return blocks;
  });

  const blocks = await Effect.runPromise(
    program.pipe(
      Effect.provide(DrizzleMemoryServiceLive),
      Effect.provide(Layer.succeed(D1Context, { db: env.DB }))
    )
  );

  return new Response(JSON.stringify({ blocks, count: blocks.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/memories - Create a new memory block
 */
async function createMemory(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    label: string;
    content: string;
    type?: 'core' | 'archival';
  };

  if (!body.label || !body.content) {
    return new Response(
      JSON.stringify({ error: 'label and content are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const program = Effect.gen(function* () {
    const service = yield* DrizzleMemoryService;
    const block = yield* service.createMemoryBlock(
      body.label,
      body.content,
      body.type || 'core'
    );
    return block;
  });

  const block = await Effect.runPromise(
    program.pipe(
      Effect.provide(DrizzleMemoryServiceLive),
      Effect.provide(Layer.succeed(D1Context, { db: env.DB }))
    )
  );

  return new Response(JSON.stringify({ success: true, block }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/memories/search - Search memory blocks
 * This is a simple text search example. For semantic search,
 * integrate with Cloudflare AI embeddings.
 */
async function searchMemories(query: string, env: Env): Promise<Response> {
  const db = drizzle(env.DB);

  const results = await db
    .select()
    .from(memoryBlocks)
    .where((table) => {
      // Simple LIKE search (D1 supports this)
      return `${table.content} LIKE '%${query}%'`;
    })
    .limit(10);

  return new Response(
    JSON.stringify({
      query,
      results,
      count: results.length,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Example: Using with semantic search
 *
 * For semantic search, you would:
 * 1. Generate embedding using env.AI
 * 2. Store embedding in memory_embeddings table
 * 3. Query and compute cosine similarity
 *
 * See src/memory/semantic-search.ts for the implementation
 */
