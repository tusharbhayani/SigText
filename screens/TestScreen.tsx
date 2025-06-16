import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import SupabaseTestPanel from '@/components/SupabaseTestPanel';

export default function TestScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SupabaseTestPanel />
    </SafeAreaView>
  );
}