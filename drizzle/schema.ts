import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Legacy memory table
export const agentMemory = sqliteTable(
  'agent_memory',
  {
    purpose: text('purpose').primaryKey(),
    text: text('text').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    updatedAtIdx: index('idx_updated_at').on(table.updatedAt),
  })
);

// Letta-style memory blocks
export const memoryBlocks = sqliteTable(
  'memory_blocks',
  {
    id: text('id').primaryKey(),
    label: text('label').notNull(),
    content: text('content').notNull(),
    type: text('type', { enum: ['core', 'archival'] }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  },
  (table) => ({
    typeUpdatedIdx: index('idx_type_updated').on(table.type, table.updatedAt),
    labelIdx: index('idx_label').on(table.label),
  })
);

// Archival memory
export const archivalMemory = sqliteTable(
  'archival_memory',
  {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
    vectorId: text('vector_id'),
  },
  (table) => ({
    createdAtIdx: index('idx_archival_created').on(table.createdAt),
  })
);

// Memory embeddings (768-dimensional vectors stored as JSON)
export const memoryEmbeddings = sqliteTable('memory_embeddings', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull(),
  contentType: text('content_type').notNull(), // 'memory_block' or 'archival'
  embedding: text('embedding', { mode: 'json' }).$type<number[]>().notNull(),
  model: text('model').notNull().default('@cf/baai/bge-base-en-v1.5'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Recursive conversation summaries
export const conversationSummariesV2 = sqliteTable(
  'conversation_summaries_v2',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    summary: text('summary').notNull(),
    summaryLevel: integer('summary_level').notNull(), // 0=base, 1+=recursive
    messageCount: integer('message_count').notNull(),
    parentSummaryId: integer('parent_summary_id'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    levelCreatedIdx: index('idx_level_created').on(table.summaryLevel, table.createdAt),
  })
);

// Type exports for TypeScript
export type AgentMemory = typeof agentMemory.$inferSelect;
export type NewAgentMemory = typeof agentMemory.$inferInsert;

export type MemoryBlock = typeof memoryBlocks.$inferSelect;
export type NewMemoryBlock = typeof memoryBlocks.$inferInsert;

export type ArchivalMemory = typeof archivalMemory.$inferSelect;
export type NewArchivalMemory = typeof archivalMemory.$inferInsert;

export type MemoryEmbedding = typeof memoryEmbeddings.$inferSelect;
export type NewMemoryEmbedding = typeof memoryEmbeddings.$inferInsert;

export type ConversationSummary = typeof conversationSummariesV2.$inferSelect;
export type NewConversationSummary = typeof conversationSummariesV2.$inferInsert;
