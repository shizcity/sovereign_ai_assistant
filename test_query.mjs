import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { messages, conversations } from './drizzle/schema.ts';
import { eq, and, gte, count } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const userId = 1;

try {
  const result = await db
    .select({ count: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        eq(messages.role, "user"),
        gte(messages.createdAt, startOfMonth)
      )
    );
  
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error.message);
  console.error('SQL:', error.sql);
}

await connection.end();
