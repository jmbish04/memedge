import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { memoryBlocks } from '../../../drizzle/schema';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
      };
    };

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ error: 'D1 database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = drizzle(runtime.env.DB);
    const blocks = await db.select().from(memoryBlocks).limit(10);

    return new Response(JSON.stringify({ blocks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching memory blocks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch memory blocks' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
      };
    };

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ error: 'D1 database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const db = drizzle(runtime.env.DB);

    const newBlock = await db
      .insert(memoryBlocks)
      .values({
        id: crypto.randomUUID(),
        label: body.label,
        content: body.content,
        type: body.type || 'core',
        updatedAt: new Date(),
        metadata: body.metadata || null,
      })
      .returning();

    return new Response(JSON.stringify({ block: newBlock[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating memory block:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create memory block' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
