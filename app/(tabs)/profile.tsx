import { db } from '@/db/client';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useTheme } from '../_layout';

type Category = {
  id: number;
  name: string;
  colour: string;
  icon: string;
};

const PRESET_COLOURS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
];

const PRESET_ICONS = [
  '💰', '🏃', '🧘', '📚', '😴', '💧', '🎯', '❤️',
  '🌱', '✍️', '🎵', '🍎', '💪', '🧠', '☀️', '🌙',
];

export default function ProfileScreen() {
  const { user, logout, deleteProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catColour, setCatColour] = useState(PRESET_COLOURS[0]);
  const [catIcon, setCatIcon] = useState(PRESET_ICONS[0]);
  const [catError, setCatError] = useState('');

  const loadCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, user.id));
      setCategoryList(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  const handleSaveCategory = async () => {
    if (!catName.trim()) { setCatError('Please enter a category name.'); return; }
    setCatError('');

    if (editingCategory) {
      await db.update(categories).set({
        name: catName.trim(),
        colour: catColour,
        icon: catIcon,
      }).where(eq(categories.id, editingCategory.id));
    } else {
      await db.insert(categories).values({
        userId: user!.id,
        name: catName.trim(),
        colour: catColour,
        icon: catIcon,
      });
    }

    setCatName('');
    setCatColour(PRESET_COLOURS[0]);
    setCatIcon(PRESET_ICONS[0]);
    setShowAddCategory(false);
    setEditingCategory(null);
    loadCategories();
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColour(cat.colour);
    setCatIcon(cat.icon);
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (id: number) => {
    Alert.alert(
      'Delete Category',
      'Are you sure? Habits using this category will need to be reassigned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await db.delete(categories).where(eq(categories.id, id));
            loadCategories();
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => {
        logout();
        router.replace('/login');
      }},
    ]);
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Profile</Text>

        {/* User Info */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
          <Text style={[styles.userName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: isDark ? '#94A3B8' : '#64748B' }]}>{user?.email}</Text>
        </View>

        {/* Theme Toggle */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </Text>
            <Pressable
              style={[styles.toggle, { backgroundColor: isDark ? '#10B981' : '#CBD5E1' }]}
              onPress={toggleTheme}
              accessibilityLabel="Toggle light and dark mode"
              accessibilityRole="switch"
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 20 : 2 }] }]} />
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Categories</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              setEditingCategory(null);
              setCatName('');
              setCatColour(PRESET_COLOURS[0]);
              setCatIcon(PRESET_ICONS[0]);
              setShowAddCategory(!showAddCategory);
            }}
            accessibilityLabel="Add new category"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnText}>{showAddCategory ? 'Cancel' : '+ Add'}</Text>
          </Pressable>
        </View>

        {showAddCategory && (
          <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? '#334155' : '#CBD5E1', color: isDark ? '#F1F5F9' : '#0F172A' }]}
              placeholder="e.g. Fitness"
              placeholderTextColor="#475569"
              value={catName}
              onChangeText={setCatName}
              accessibilityLabel="Category name"
            />

            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>Colour</Text>
            <View style={styles.colourRow}>
              {PRESET_COLOURS.map(colour => (
                <Pressable
                  key={colour}
                  style={[styles.colourDot, { backgroundColor: colour }, catColour === colour && styles.colourDotSelected]}
                  onPress={() => setCatColour(colour)}
                  accessibilityLabel={`Select colour ${colour}`}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map(icon => (
                <Pressable
                  key={icon}
                  style={[styles.iconBtn, catIcon === icon && { backgroundColor: catColour + '33', borderColor: catColour }]}
                  onPress={() => setCatIcon(icon)}
                  accessibilityLabel={`Select icon ${icon}`}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </Pressable>
              ))}
            </View>

            {catError ? <Text style={styles.error}>{catError}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSaveCategory}
              accessibilityLabel="Save category"
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>
                {editingCategory ? 'Save Changes' : 'Save Category'}
              </Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color="#10B981" />
        ) : categoryList.length === 0 ? (
          <Text style={[styles.empty, { color: isDark ? '#475569' : '#94A3B8' }]}>
            No categories yet. Add one above.
          </Text>
        ) : (
          categoryList.map(cat => (
            <View key={cat.id} style={[styles.catCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View style={styles.catLeft}>
                <View style={[styles.catIconCircle, { backgroundColor: cat.colour + '33' }]}>
                  <Text style={styles.catIconText}>{cat.icon}</Text>
                </View>
                <Text style={[styles.catName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{cat.name}</Text>
              </View>
              <View style={styles.catActions}>
                <Pressable
                  onPress={() => handleEditCategory(cat)}
                  style={({ pressed }) => [styles.catEditBtn, pressed && { opacity: 0.7 }]}
                  accessibilityLabel={`Edit ${cat.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.catEditText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteCategory(cat.id)}
                  style={({ pressed }) => [styles.catDeleteBtn, pressed && { opacity: 0.7 }]}
                  accessibilityLabel={`Delete ${cat.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.catDeleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
            onPress={handleLogout}
            accessibilityLabel="Log out"
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
            onPress={handleDeleteProfile}
            accessibilityLabel="Delete account"
            accessibilityRole="button"
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 20 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  userName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  addBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  colourRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colourDot: { width: 28, height: 28, borderRadius: 14 },
  colourDotSelected: { borderWidth: 3, borderColor: '#fff' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  error: { color: '#F87171', fontSize: 13, marginTop: 8 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
  catCard: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  catIconText: { fontSize: 18 },
  catName: { fontSize: 15, fontWeight: '600' },
  catActions: { flexDirection: 'row', gap: 8 },
  catEditBtn: { backgroundColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  catEditText: { color: '#60A5FA', fontWeight: '600', fontSize: 12 },
  catDeleteBtn: { backgroundColor: '#3B1F1F', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  catDeleteText: { color: '#F87171', fontWeight: '600', fontSize: 12 },
  accountActions: { marginTop: 24, gap: 12 },
  logoutBtn: { backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  logoutText: { color: '#F1F5F9', fontWeight: '600', fontSize: 15 },
  deleteBtn: { backgroundColor: '#3B1F1F', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#7F1D1D' },
  deleteText: { color: '#F87171', fontWeight: '600', fontSize: 15 },
});