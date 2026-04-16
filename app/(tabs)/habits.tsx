import { db } from '@/db/client';
import { categories, habits } from '@/db/schema';
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

type Habit = {
  id: number;
  name: string;
  description: string | null;
  type: string;
  unit: string | null;
  targetValue: number | null;
  frequency: string;
  categoryName: string;
  categoryColour: string;
  categoryIcon: string;
};

export default function HabitsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

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

      const combined: Habit[] = allHabits.map(habit => {
        const category = allCategories.find(c => c.id === habit.categoryId);
        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          type: habit.type,
          unit: habit.unit,
          targetValue: habit.targetValue,
          frequency: habit.frequency,
          categoryName: category?.name ?? 'Uncategorised',
          categoryColour: category?.colour ?? '#94A3B8',
          categoryIcon: category?.icon ?? '📌',
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

  const deleteHabit = async (id: number) => {
    await db
      .update(habits)
      .set({ isActive: false })
      .where(eq(habits.id, id));
    loadHabits();
  };

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
          <Text style={styles.title}>My Habits</Text>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={() => router.push('/add-habit')}
            accessibilityLabel="Add new habit"
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {habitList.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No habits yet.</Text>
            <Text style={styles.emptySubText}>Tap + Add to create your first habit.</Text>
          </View>
        ) : (
          habitList.map(habit => (
            <View key={habit.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  {habit.description ? (
                    <Text style={styles.habitDesc}>{habit.description}</Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: habit.categoryColour + '33' }]}>
                      <Text style={[styles.badgeText, { color: habit.categoryColour }]}>
                        {habit.categoryIcon} {habit.categoryName}
                      </Text>
                    </View>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{habit.type}</Text>
                    </View>
                  </View>
                  {habit.targetValue ? (
                    <Text style={styles.target}>
                      Target: {habit.type === 'financial' ? '€' : ''}{habit.targetValue} {habit.unit ?? ''} / {habit.frequency}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push({ pathname: '/edit-habit', params: { id: habit.id } })}
                  accessibilityLabel={`Edit ${habit.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => deleteHabit(habit.id)}
                  accessibilityLabel={`Delete ${habit.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9' },
  addButton: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonPressed: { opacity: 0.8 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 48 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#475569', marginTop: 8 },
  card: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  habitDesc: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  typeBadge: { backgroundColor: '#0F172A', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  target: { fontSize: 12, color: '#64748B' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: '#1E3A5F', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { color: '#60A5FA', fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: '#3B1F1F', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { color: '#F87171', fontWeight: '600', fontSize: 13 },
});
