import { db } from '@/db/client';
import { categories, habitLogs, habits } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';

const screenWidth = Dimensions.get('window').width - 40;

type QuoteData = {
  q: string;
  a: string;
};

export default function InsightsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<{ name: string; streak: number }[]>([]);
  const [totalThisWeek, setTotalThisWeek] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);

  const fetchQuote = async () => {
    setQuoteLoading(true);
    try {
      const res = await fetch('https://zenquotes.io/api/random');
      const data = await res.json();
      setQuote({ q: data[0].q, a: data[0].a });
    } catch (e) {
      setQuote({ q: 'Small steps every day lead to big results.', a: 'Momentum' });
    } finally {
      setQuoteLoading(false);
    }
  };

  const calculateStreak = (logs: { date: string; completed: boolean }[]): number => {
    const sorted = [...logs]
      .filter(l => l.completed)
      .map(l => l.date)
      .sort()
      .reverse();

    if (sorted.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date();
      expected.setDate(today.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];

      if (sorted[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const loadInsights = async () => {
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

      const allLogs = await db
        .select()
        .from(habitLogs)
        .where(eq(habitLogs.userId, user.id));

      // Weekly bar chart — last 7 days
      const labels: string[] = [];
      const data: number[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        const count = allLogs.filter(l => l.date === dateStr && l.completed).length;
        labels.push(dayName);
        data.push(count);
      }

      setWeeklyData({ labels, data });

      // Weekly and monthly totals
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const weeklyLogs = allLogs.filter(l => l.completed && l.date >= weekAgo.toISOString().split('T')[0]);
      const monthlyLogs = allLogs.filter(l => l.completed && l.date >= monthStart.toISOString().split('T')[0]);

      setTotalThisWeek(weeklyLogs.length);
      setTotalThisMonth(monthlyLogs.length);

      // Pie chart — completions by category
      const COLOURS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
      const catData = allCategories.map((cat, index) => {
        const catHabits = allHabits.filter(h => h.categoryId === cat.id);
        const catLogs = allLogs.filter(l =>
          l.completed && catHabits.some(h => h.id === l.habitId)
        );
        return {
          name: cat.name,
          count: catLogs.length,
          color: cat.colour || COLOURS[index % COLOURS.length],
          legendFontColor: '#94A3B8',
          legendFontSize: 12,
        };
      }).filter(c => c.count > 0);

      setCategoryData(catData);

      // Streak calculation
      const streakData = allHabits.map(habit => {
        const habitLogs = allLogs.filter(l => l.habitId === habit.id);
        const streak = calculateStreak(habitLogs);
        return { name: habit.name, streak };
      }).filter(s => s.streak > 0).sort((a, b) => b.streak - a.streak);

      setStreaks(streakData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInsights();
      fetchQuote();
    }, [user])
  );

  const chartConfig = {
    backgroundGradientFrom: '#1E293B',
    backgroundGradientTo: '#1E293B',
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
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
        <Text style={styles.title}>Insights</Text>

        {/* Daily Quote */}
        <View style={styles.quoteCard}>
          {quoteLoading ? (
            <ActivityIndicator color="#10B981" />
          ) : (
            <>
              <Text style={styles.quoteText}>"{quote?.q}"</Text>
              <Text style={styles.quoteAuthor}>— {quote?.a}</Text>
            </>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalThisWeek}</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalThisMonth}</Text>
            <Text style={styles.summaryLabel}>This Month</Text>
          </View>
        </View>

        {/* Weekly Bar Chart */}
        <Text style={styles.sectionTitle}>Completions This Week</Text>
        {weeklyData.data.every(d => d === 0) ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No completions yet this week.</Text>
          </View>
        ) : (
          <View style={styles.chartCard}>
            <BarChart
              data={{
                labels: weeklyData.labels,
                datasets: [{ data: weeklyData.data.map(d => d === 0 ? 0.01 : d) }],
              }}
              width={screenWidth - 32}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              withInnerLines={false}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>By Category</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={categoryData}
                width={screenWidth - 32}
                height={180}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="16"
                style={styles.chart}
              />
            </View>
          </>
        )}

        {/* Streaks */}
        {streaks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔥 Current Streaks</Text>
            {streaks.map((s, index) => (
              <View key={index} style={styles.streakCard}>
                <Text style={styles.streakName}>{s.name}</Text>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakValue}>🔥 {s.streak} day{s.streak !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  loader: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginTop: 16, marginBottom: 20 },
  quoteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  quoteText: { fontSize: 14, color: '#CBD5E1', fontStyle: 'italic', lineHeight: 22, marginBottom: 8 },
  quoteAuthor: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryValue: { fontSize: 32, fontWeight: '700', color: '#10B981' },
  summaryLabel: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  chartCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 24, overflow: 'hidden' },
  chart: { borderRadius: 8 },
  emptyChart: { backgroundColor: '#1E293B', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyText: { color: '#475569', fontSize: 14 },
  streakCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  streakName: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  streakBadge: { backgroundColor: '#F59E0B22', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  streakValue: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
});
