import { db } from '@/db/client';
import { categories, habits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './_layout';

type Category = {
  id: number;
  name: string;
  colour: string;
  icon: string;
};

export default function EditHabitScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'boolean' | 'quantity' | 'financial'>('boolean');
  const [unit, setUnit] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !id) return;

    db.select().from(categories).where(eq(categories.userId, user.id)).then(setCategoryList);

    db.select().from(habits).where(eq(habits.id, Number(id))).then(result => {
      if (result.length === 0) return;
      const habit = result[0];
      setName(habit.name);
      setDescription(habit.description ?? '');
      setType(habit.type as 'boolean' | 'quantity' | 'financial');
      setUnit(habit.unit ?? '');
      setTargetValue(habit.targetValue?.toString() ?? '');
      setFrequency(habit.frequency as 'daily' | 'weekly');
      setCategoryId(habit.categoryId);
    });
  }, [user, id]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a habit name.'); return; }
    if (!categoryId) { setError('Please select a category.'); return; }
    if (type !== 'boolean' && !targetValue.trim()) { setError('Please enter a target value.'); return; }

    setLoading(true);
    setError('');

    try {
      await db.update(habits).set({
        name: name.trim(),
        description: description.trim() || null,
        type,
        unit: unit.trim() || null,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        frequency,
        categoryId: categoryId!,
      }).where(eq(habits.id, Number(id)));

      router.back();
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Go back">
              <Text style={styles.back}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Edit Habit</Text>
          </View>

          <Text style={styles.label}>Habit Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Run"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
            accessibilityLabel="Habit name"
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Run at least 5km before 9am"
            placeholderTextColor="#475569"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            accessibilityLabel="Habit description"
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.optionRow}>
            {(['boolean', 'quantity', 'financial'] as const).map(t => (
              <Pressable
                key={t}
                style={[styles.optionBtn, type === t && styles.optionBtnActive]}
                onPress={() => setType(t)}
                accessibilityLabel={`Select ${t} type`}
                accessibilityRole="button"
              >
                <Text style={[styles.optionText, type === t && styles.optionTextActive]}>
                  {t === 'boolean' ? '✓ Yes/No' : t === 'quantity' ? '# Quantity' : '€ Financial'}
                </Text>
              </Pressable>
            ))}
          </View>

          {type !== 'boolean' && (
            <>
              <Text style={styles.label}>
                {type === 'financial' ? 'Daily Target (€)' : 'Target Value'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={type === 'financial' ? 'e.g. 20' : 'e.g. 5'}
                placeholderTextColor="#475569"
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
                accessibilityLabel="Target value"
              />

              {type === 'quantity' && (
                <>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. km, glasses, minutes"
                    placeholderTextColor="#475569"
                    value={unit}
                    onChangeText={setUnit}
                    accessibilityLabel="Unit of measurement"
                  />
                </>
              )}
            </>
          )}

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.optionRow}>
            {(['daily', 'weekly'] as const).map(f => (
              <Pressable
                key={f}
                style={[styles.optionBtn, frequency === f && styles.optionBtnActive]}
                onPress={() => setFrequency(f)}
                accessibilityLabel={`Select ${f} frequency`}
                accessibilityRole="button"
              >
                <Text style={[styles.optionText, frequency === f && styles.optionTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Category</Text>
          {categoryList.length === 0 ? (
            <Text style={styles.noCat}>
              No categories yet. Go to the Profile tab to add one.
            </Text>
          ) : (
            <View style={styles.categoryGrid}>
              {categoryList.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catBtn,
                    { borderColor: cat.colour },
                    categoryId === cat.id && { backgroundColor: cat.colour + '33' },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  accessibilityLabel={`Select ${cat.name} category`}
                  accessibilityRole="button"
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, { color: cat.colour }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
            disabled={loading}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginTop: 16, marginBottom: 24 },
  back: { color: '#10B981', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9' },
  label: { fontSize: 13, fontWeight: '600', color: '#CBD5E1', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F1F5F9',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionBtnActive: { backgroundColor: '#10B98122', borderColor: '#10B981' },
  optionText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  optionTextActive: { color: '#10B981' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catIcon: { fontSize: 16 },
  catName: { fontSize: 13, fontWeight: '600' },
  noCat: { color: '#475569', fontSize: 13, fontStyle: 'italic' },
  error: { color: '#F87171', fontSize: 13, marginTop: 12 },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
