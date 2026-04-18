import { db } from '@/db/client';
import { habitLogs, habits, targets } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';

type Target = {
  id: number;
  habitId: number;
  habitName: string;
  habitType: string;
  habitUnit: string | null;
  period: string;
  targetValue: number;
  currentValue: number;
};

export default function TargetsScreen() {
  const { user } = useAuth();
  const [targetList, setTargetList] = useState<Target[]>([]);
  const [habitList, setHabitList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [targetValue, setTargetValue] = useState('');
  const [error, setError] = useState('');

  const getDateRange = (period: string) => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start: string;

    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      start = weekAgo.toISOString().split('T')[0];
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
    }
    return { start, end };
  };

  const loadTargets = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const allTargets = await db
        .select()
        .from(targets)
        .where(eq(targets.userId, user.id));

      const allHabits = await db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, user.id), eq(habits.isActive, true)));

      setHabitList(allHabits);

      const combined: Target[] = await Promise.all(
        allTargets.map(async target => {
          const habit = allHabits.find(h => h.id === target.habitId);
          const { start, end } = getDateRange(target.period);

          const logs = await db
            .select()
            .from(habitLogs)
            .where(and(
              eq(habitLogs.habitId, target.habitId),
              eq(habitLogs.userId, user.id),
            ));

          const filteredLogs = logs.filter(l => l.date >= start && l.date <= end);

          let currentValue = 0;
          if (habit?.type === 'boolean') {
            currentValue = filteredLogs.filter(l => l.completed).length;
          } else {
            currentValue = filteredLogs.reduce((sum, l) => sum + (l.value ?? 0), 0);
          }

          return {
            id: target.id,
            habitId: target.habitId,
            habitName: habit?.name ?? 'Unknown',
            habitType: habit?.type ?? 'boolean',
            habitUnit: habit?.unit ?? null,
            period: target.period,
            targetValue: target.targetValue,
            currentValue,
          };
        })
      );

      setTargetList(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTargets();
    }, [user])
  );

  const handleAddTarget = async () => {
    if (!selectedHabitId) { setError('Please select a habit.'); return; }
    if (!targetValue.trim()) { setError('Please enter a target value.'); return; }

    setError('');

    await db.insert(targets).values({
      userId: user!.id,
      habitId: selectedHabitId,
      period,
      targetValue: parseFloat(targetValue),
      createdAt: new Date().toISOString(),
    });

    setSelectedHabitId(null);
    setPeriod('weekly');
    setTargetValue('');
    setShowAdd(false);
    loadTargets();
  };

  const handleDeleteTarget = async (id: number) => {
    await db.delete(targets).where(eq(targets.id, id));
    loadTargets();
  };

  const getStatus = (current: number, target: number) => {
    const percent = (current / target) * 100;
    if (percent >= 100) return { label: '🎉 Exceeded', color: '#10B981' };
    if (percent >= 60) return { label: '✅ On Track', color: '#3B82F6' };
    return { label: '⚠️ Behind', color: '#F59E0B' };
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
          <Text style={styles.title}>Targets</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setShowAdd(!showAdd)}
            accessibilityLabel="Add new target"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : '+ Add'}</Text>
          </Pressable>
        </View>

        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>New Target</Text>

            <Text style={styles.label}>Habit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitScroll}>
              {habitList.map(habit => (
                <Pressable
                  key={habit.id}
                  style={[styles.habitChip, selectedHabitId === habit.id && styles.habitChipActive]}
                  onPress={() => setSelectedHabitId(habit.id)}
                  accessibilityLabel={`Select habit ${habit.name}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.habitChipText, selectedHabitId === habit.id && styles.habitChipTextActive]}>
                    {habit.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Period</Text>
            <View style={styles.optionRow}>
              {(['weekly', 'monthly'] as const).map(p => (
                <Pressable
                  key={p}
                  style={[styles.optionBtn, period === p && styles.optionBtnActive]}
                  onPress={() => setPeriod(p)}
                  accessibilityLabel={`Select ${p} period`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, period === p && styles.optionTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Target Value</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5 (times) or 100 (€)"
              placeholderTextColor="#475569"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
              accessibilityLabel="Target value"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleAddTarget}
              accessibilityLabel="Save target"
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>Save Target</Text>
            </Pressable>
          </View>
        )}

        {targetList.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No targets yet.</Text>
            <Text style={styles.emptySubText}>Tap + Add to set your first goal.</Text>
          </View>
        ) : (
          targetList.map(target => {
            const percent = Math.min((target.currentValue / target.targetValue) * 100, 100);
            const status = getStatus(target.currentValue, target.targetValue);

            return (
              <View key={target.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.habitName}>{target.habitName}</Text>
                    <Text style={styles.periodLabel}>
                      {target.period.charAt(0).toUpperCase() + target.period.slice(1)} target
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteTarget(target.id)}
                    style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                    accessibilityLabel={`Delete target for ${target.habitName}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {target.habitType === 'financial'
                      ? `€${target.currentValue.toFixed(0)} / €${target.targetValue}`
                      : `${target.currentValue} / ${target.targetValue} ${target.habitUnit ?? 'times'}`}
                  </Text>
                  <Text style={[styles.statusLabel, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${percent}%` as any, backgroundColor: status.color },
                    ]}
                  />
                </View>

                <Text style={styles.remainingText}>
                  {target.currentValue >= target.targetValue
                    ? 'Goal reached!'
                    : target.habitType === 'financial'
                    ? `€${(target.targetValue - target.currentValue).toFixed(0)} remaining`
                    : `${(target.targetValue - target.currentValue).toFixed(0)} ${target.habitUnit ?? 'times'} remaining`}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  loader: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9' },
  addBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  addTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#CBD5E1', marginBottom: 8, marginTop: 12 },
  habitScroll: { marginBottom: 4 },
  habitChip: { backgroundColor: '#0F172A', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  habitChipActive: { backgroundColor: '#10B98122', borderColor: '#10B981' },
  habitChipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  habitChipTextActive: { color: '#10B981' },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, backgroundColor: '#0F172A', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  optionBtnActive: { backgroundColor: '#10B98122', borderColor: '#10B981' },
  optionText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  optionTextActive: { color: '#10B981' },
  input: { backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#F1F5F9' },
  error: { color: '#F87171', fontSize: 13, marginTop: 8 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 48 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#475569', marginTop: 8 },
  card: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  habitName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  periodLabel: { fontSize: 12, color: '#64748B' },
  deleteBtn: { backgroundColor: '#3B1F1F', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: '#F87171', fontWeight: '600', fontSize: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { fontSize: 13, color: '#94A3B8' },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { backgroundColor: '#334155', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: 8, borderRadius: 99 },
  remainingText: { fontSize: 12, color: '#475569' },
});
