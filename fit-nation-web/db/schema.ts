// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const enquiries=sqliteTable('enquiries',{id:text('id').primaryKey(),name:text('name').notNull(),phone:text('phone').notNull(),branch:text('branch').notNull(),interest:text('interest').notNull(),message:text('message').notNull(),status:text('status').notNull().default('new'),createdAt:integer('created_at').notNull(),ipHash:text('ip_hash').notNull()});
export const members=sqliteTable('members',{
  id:text('id').primaryKey(),email:text('email').notNull(),createdAt:integer('created_at').notNull(),
},table=>[uniqueIndex('members_email_unique').on(table.email)]);
export const authChallenges=sqliteTable('auth_challenges',{
  id:text('id').primaryKey(),email:text('email').notNull(),emailHash:text('email_hash').notNull(),codeHash:text('code_hash').notNull(),browserHash:text('browser_hash').notNull(),
  createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull(),attempts:integer('attempts').notNull().default(0),usedAt:integer('used_at'),
},table=>[index('auth_challenges_email_idx').on(table.emailHash),index('auth_challenges_expiry_idx').on(table.expiresAt)]);
export const memberSessions=sqliteTable('member_sessions',{
  tokenHash:text('token_hash').primaryKey(),memberId:text('member_id').notNull().references(()=>members.id,{onDelete:'cascade'}),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull(),
},table=>[index('member_sessions_expiry_idx').on(table.expiresAt)]);
export const authRateLimits=sqliteTable('auth_rate_limits',{
  id:text('id').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull(),
},table=>[index('auth_rate_limits_expiry_idx').on(table.expiresAt)]);
