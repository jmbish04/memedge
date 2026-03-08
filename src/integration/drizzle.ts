import { drizzle } from 'drizzle-orm/d1';
import { Effect, Layer, Context } from 'effect';
import { memoryBlocks, agentMemory } from '../drizzle/schema';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Integration layer for using Memedge with Drizzle ORM and D1
 *
 * This example shows how to create an Effect-based service that uses
 * Drizzle ORM instead of the raw SQL interface.
 */

// Service interface for Drizzle-based memory operations
export interface DrizzleMemoryService {
  readonly getMemoryBlocks: () => Effect.Effect<
    Array<typeof memoryBlocks.$inferSelect>,
    Error
  >;
  readonly createMemoryBlock: (
    label: string,
    content: string,
    type: 'core' | 'archival'
  ) => Effect.Effect<typeof memoryBlocks.$inferSelect, Error>;
  readonly getLegacyMemory: (
    purpose: string
  ) => Effect.Effect<typeof agentMemory.$inferSelect | null, Error>;
}

// Context tag for the service
export const DrizzleMemoryService = Context.GenericTag<DrizzleMemoryService>(
  '@services/DrizzleMemory'
);

// Context for D1 database binding
export interface D1Context {
  readonly db: D1Database;
}

export const D1Context = Context.GenericTag<D1Context>('@context/D1');

/**
 * Live implementation of the Drizzle Memory Service
 */
export const DrizzleMemoryServiceLive = Layer.effect(
  DrizzleMemoryService,
  Effect.gen(function* () {
    const { db: d1 } = yield* D1Context;
    const db = drizzle(d1);

    return {
      getMemoryBlocks: () =>
        Effect.tryPromise({
          try: () => db.select().from(memoryBlocks).all(),
          catch: (error) => new Error(`Failed to fetch memory blocks: ${error}`),
        }),

      createMemoryBlock: (label, content, type) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(memoryBlocks)
              .values({
                id: crypto.randomUUID(),
                label,
                content,
                type,
                updatedAt: new Date(),
                metadata: null,
              })
              .returning();
            return result[0];
          },
          catch: (error) => new Error(`Failed to create memory block: ${error}`),
        }),

      getLegacyMemory: (purpose) =>
        Effect.tryPromise({
          try: async () => {
            const results = await db
              .select()
              .from(agentMemory)
              .where((table) => table.purpose === purpose)
              .limit(1);
            return results[0] || null;
          },
          catch: (error) => new Error(`Failed to fetch legacy memory: ${error}`),
        }),
    };
  })
);

/**
 * Example usage in a Cloudflare Worker
 */
export async function handleRequest(
  request: Request,
  env: Env
): Promise<Response> {
  // Create the program
  const program = Effect.gen(function* () {
    const service = yield* DrizzleMemoryService;

    // Fetch all memory blocks
    const blocks = yield* service.getMemoryBlocks();

    // Create a new block
    if (request.method === 'POST') {
      const body = await request.json() as { label: string; content: string };
      const newBlock = yield* service.createMemoryBlock(
        body.label,
        body.content,
        'core'
      );
      return { success: true, block: newBlock };
    }

    return { blocks };
  });

  // Run the program with proper context
  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(DrizzleMemoryServiceLive),
      Effect.provide(Layer.succeed(D1Context, { db: env.DB }))
    )
  );

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Example: Combining with existing Memedge services
export const CombinedMemoryLayer = Layer.mergeAll(
  DrizzleMemoryServiceLive,
  // Add other Memedge layers here
  // MemoryBlockManagerLive,
  // MemoryManagerLive,
);

/**
 * Usage in Astro API route:
 *
 * ```typescript
 * import { DrizzleMemoryService, DrizzleMemoryServiceLive, D1Context } from '@/integration/drizzle';
 *
 * export const GET: APIRoute = async ({ locals }) => {
 *   const program = Effect.gen(function* () {
 *     const service = yield* DrizzleMemoryService;
 *     const blocks = yield* service.getMemoryBlocks();
 *     return blocks;
 *   });
 *
 *   const blocks = await Effect.runPromise(
 *     program.pipe(
 *       Effect.provide(DrizzleMemoryServiceLive),
 *       Effect.provide(Layer.succeed(D1Context, { db: locals.runtime.env.DB }))
 *     )
 *   );
 *
 *   return new Response(JSON.stringify({ blocks }));
 * };
 * ```
 */
