import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('created_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  colour: text('colour').notNull(),
  icon: text('icon').notNull(),
});

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['boolean', 'quantity', 'financial'] }).notNull(),
  unit: text('unit'),
  targetValue: real('target_value'),
  frequency: text('frequency', { enum: ['daily', 'weekly'] }).notNull().default('daily'),
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull().references(() => habits.id),
  userId: integer('user_id').notNull().references(() => users.id),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  value: real('value'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull().references(() => habits.id),
  userId: integer('user_id').notNull().references(() => users.id),
  period: text('period', { enum: ['weekly', 'monthly'] }).notNull(),
  targetValue: real('target_value').notNull(),
  createdAt: text('created_at').notNull(),
});