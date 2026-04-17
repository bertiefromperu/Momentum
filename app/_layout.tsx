import { db } from '@/db/client';
import { users } from '@/db/schema';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { Stack } from 'expo-router';
import { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  deleteProfile: () => Promise<void>;
};

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export const ThemeContext = createContext<ThemeContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [user, setUser] = useState<User | null>(null);

  const toggleTheme = () => setIsDark(prev => !prev);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      if (result.length === 0) return false;
      const found = result[0];
      if (found.password !== password) return false;

      setUser({ id: found.id, name: found.name, email: found.email });
      return true;
    } catch (e) {
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      if (existing.length > 0) return false;

      await db.insert(users).values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        createdAt: new Date().toISOString(),
      });

      const created = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      setUser({ id: created[0].id, name: created[0].name, email: created[0].email });
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => setUser(null);

  const deleteProfile = async () => {
    if (!user) return;
    await db.delete(users).where(eq(users.id, user.id));
    setUser(null);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <AuthContext.Provider value={{ user, login, register, logout, deleteProfile }}>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="add-habit" />
            <Stack.Screen name="edit-habit" />
          </Stack>
        </ThemeProvider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
