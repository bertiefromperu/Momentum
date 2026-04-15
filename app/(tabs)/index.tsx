import { db } from '@/db/client';
import { categories, habitLogs, habits } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';

type HabitWithStatus = {
  id: number;
  name: string;
  type: string;
  unit: string | null;
  targetValue: number | null;
  categoryName: string;
  categoryColour: string;
  categoryIcon: string;
  completed: boolean;
  value: number | null;
  logId: number | null;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [habitList, setHabitList] = useState<HabitWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadHabits = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const allHabits = await db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, user.id), eq(habits.isActive, true)));

      const allCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, user.id));

      const todayLogs = await db
        .select()
        .from(habitLogs)
        .where(and(eq(habitLogs.userId, user.id), eq(habitLogs.date, today)));

      const combined: HabitWithStatus[] = allHabits.map(habit => {
        const category = allCategories.find(c => c.id === habit.categoryId);
        const log = todayLogs.find(l => l.habitId === habit.id);
        return {
          id: habit.id,
          name: habit.name,
          type: habit.type,
          unit: habit.unit,
          targetValue: habit.targetValue,
          categoryName: category?.name ?? 'Uncategorised',
          categoryColour: category?.colour ?? '#94A3B8',
          categoryIcon: category?.icon ?? '📌',
          completed: log?.completed ?? false,
          value: log?.value ?? null,
          logId: log?.id ?? null,
        };
      });

      setHabitList(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, [user]);

  const toggleHabit = async (habit: HabitWithStatus) => {
    if (!user) return;
    const now = new Date().toISOString();

    if (habit.logId) {
      await db
        .delete(habitLogs)
        .where(eq(habitLogs.id, habit.logId));
    } else {
      await db.insert(habitLogs).values({
        habitId: habit.id,
        userId: user.id,
        date: today,
        completed: true,
        value: habit.targetValue,
        notes: null,
        createdAt: now,
      });
    }

    loadHabits();
  };

  const completedCount = habitList.filter(h => h.completed).length;
  const totalCount = habitList.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()}, {user?.name} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-IE', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressCount}>{completedCount}/{totalCount}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSub}>
            {completedCount === totalCount && totalCount > 0
              ? '🎉 All habits done!'
              : `${totalCount - completedCount} remaining`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Today's Habits</Text>

        {habitList.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No habits yet.</Text>
            <Text style={styles.emptySubText}>Tap the Habits tab to add your first one.</Text>
          </View>
        ) : (
          habitList.map(habit => (
            <Pressable
              key={habit.id}
              style={({ pressed }) => [
                styles.habitCard,
                habit.completed && styles.habitCardDone,
                pressed && styles.habitCardPressed,
              ]}
              onPress={() => toggleHabit(habit)}
              accessibilityLabel={`${habit.name}, ${habit.completed ? 'completed' : 'not completed'}, tap to toggle`}
              accessibilityRole="button"
            >
              <View style={styles.habitLeft}>
                <View style={[styles.checkbox, habit.completed && styles.checkboxDone]}>
                  {habit.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View>
                  <Text style={[styles.habitName, habit.completed && styles.habitNameDone]}>
                    {habit.name}
                  </Text>
                  <View style={styles.habitMeta}>
                    <View style={[styles.badge, { backgroundColor: habit.categoryColour + '33' }]}>
                      <Text style={[styles.badgeText, { color: habit.categoryColour }]}>
                        {habit.categoryIcon} {habit.categoryName}
                      </Text>
                    </View>
                    {habit.type === 'financial' && (
                      <Text style={styles.metaText}>€{habit.targetValue}/day</Text>
                    )}
                    {habit.type === 'quantity' && (
                      <Text style={styles.metaText}>{habit.targetValue} {habit.unit}</Text>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  loader: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { marginTop: 16, marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#F1F5F9' },
  date: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  progressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressTitle: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  progressCount: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  progressBarBg: { backgroundColor: '#334155', borderRadius: 99, height: 8, overflow: 'hidden' },
  progressBarFill: { backgroundColor: '#10B981', height: 8, borderRadius: 99 },
  progressSub: { fontSize: 13, color: '#94A3B8', marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  empty: { alignItems: 'center', marginTop: 48 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#475569', marginTop: 8 },
  habitCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  habitCardDone: { borderColor: '#10B981', opacity: 0.75 },
  habitCardPressed: { opacity: 0.85 },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  habitName: { fontSize: 15, fontWeight: '600', color: '#F1F5F9', marginBottom: 4 },
  habitNameDone: { textDecorationLine: 'line-through', color: '#64748B' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#64748B' },
});
