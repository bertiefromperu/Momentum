import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../_layout';

function TabIcon({ color, focused, children }: { color: string; focused: boolean; children: string }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <View>
        {/* icon placeholder */}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: isDark ? '#475569' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} focused={false}>🏠</TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} focused={false}>✓</TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} focused={false}>📊</TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} focused={false}>🎯</TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} focused={false}>👤</TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  iconFocused: {
    backgroundColor: '#D1FAE5',
  },
});