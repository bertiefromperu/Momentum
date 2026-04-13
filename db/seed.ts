import { db } from './client';
import { categories, habitLogs, habits, targets, users } from './schema';

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Create demo user
  await db.insert(users).values({
    name: 'Roberto',
    email: 'roberto@momentum.com',
    password: 'Password1234',
    createdAt: now,
  });

  const allUsers = await db.select().from(users);
  const userId = allUsers[0].id;

  // Categories
  await db.insert(categories).values([
    { userId, name: 'Finance',     colour: '#10B981', icon: '💰' },
    { userId, name: 'Fitness',     colour: '#3B82F6', icon: '🏃' },
    { userId, name: 'Mindfulness', colour: '#8B5CF6', icon: '🧘' },
    { userId, name: 'Learning',    colour: '#F59E0B', icon: '📚' },
    { userId, name: 'Sleep',       colour: '#6366F1', icon: '😴' },
  ]);

  const allCategories = await db.select().from(categories);
  const finance     = allCategories.find(c => c.name === 'Finance')!;
  const fitness     = allCategories.find(c => c.name === 'Fitness')!;
  const mindfulness = allCategories.find(c => c.name === 'Mindfulness')!;
  const learning    = allCategories.find(c => c.name === 'Learning')!;
  const sleep       = allCategories.find(c => c.name === 'Sleep')!;

  // Habits
  await db.insert(habits).values([
    {
      userId,
      categoryId: finance.id,
      name: 'Daily Savings',
      description: 'Save a set amount each day toward your monthly goal',
      type: 'financial',
      unit: '€',
      targetValue: 20,
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
    {
      userId,
      categoryId: finance.id,
      name: 'No Unnecessary Spending',
      description: 'Avoid impulse purchases today',
      type: 'boolean',
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
    {
      userId,
      categoryId: fitness.id,
      name: 'Morning Run',
      description: 'Run at least 5km before 9am',
      type: 'quantity',
      unit: 'km',
      targetValue: 5,
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
    {
      userId,
      categoryId: fitness.id,
      name: 'Drink Water',
      description: 'Drink 8 glasses of water throughout the day',
      type: 'quantity',
      unit: 'glasses',
      targetValue: 8,
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
    {
      userId,
      categoryId: mindfulness.id,
      name: 'Meditation',
      description: 'Meditate for at least 10 minutes',
      type: 'boolean',
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
    {
      userId,
      categoryId: learning.id,
      name: 'Read',
      description: 'Read for at least 30 minutes',
      type: 'quantity',
      unit: 'minutes',
      targetValue: 30,
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
    {
      userId,
      categoryId: sleep.id,
      name: 'Sleep by 11pm',
      description: 'Be in bed with lights off by 11pm',
      type: 'boolean',
      frequency: 'daily',
      createdAt: now,
      isActive: true,
    },
  ]);

  const allHabits = await db.select().from(habits);

  // Generate logs for the past 14 days
  const logs = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    for (const habit of allHabits) {
      const completed = Math.random() > 0.25;
      let value = null;

      if (habit.type === 'financial') value = completed ? 20 : Math.random() > 0.5 ? 10 : 0;
      if (habit.type === 'quantity' && habit.targetValue) {
        value = completed ? habit.targetValue : Math.round(habit.targetValue * Math.random());
      }

      logs.push({
        habitId: habit.id,
        userId,
        date: dateStr,
        completed,
        value,
        notes: null,
        createdAt: now,
      });
    }
  }

  await db.insert(habitLogs).values(logs);

  // Targets
  await db.insert(targets).values([
    {
      userId,
      habitId: allHabits.find(h => h.name === 'Daily Savings')!.id,
      period: 'monthly',
      targetValue: 500,
      createdAt: now,
    },
    {
      userId,
      habitId: allHabits.find(h => h.name === 'Morning Run')!.id,
      period: 'weekly',
      targetValue: 25,
      createdAt: now,
    },
    {
      userId,
      habitId: allHabits.find(h => h.name === 'Read')!.id,
      period: 'weekly',
      targetValue: 210,
      createdAt: now,
    },
    {
      userId,
      habitId: allHabits.find(h => h.name === 'Meditation')!.id,
      period: 'weekly',
      targetValue: 7,
      createdAt: now,
    },
  ]);
}