import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  addSampleOrganizations, 
  testMessageVerification, 
  getOrganizations,
  verifyMessage 
} from '@/lib/supabase';
import { Database, TestTube, Users, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function SupabaseTestPanel() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => [...prev, { testName, result, success: true, timestamp: new Date() }]);
      Alert.alert('Success', `${testName} completed successfully`);
    } catch (error) {
      setResults(prev => [...prev, { testName, error: error.message, success: false, timestamp: new Date() }]);
      Alert.alert('Error', `${testName} failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    const { data, error } = await getOrganizations();
    if (error) throw error;
    return { message: `Connected successfully. Found ${data?.length || 0} organizations.`, data };
  };

  const addSampleData = async () => {
    const results = await addSampleOrganizations();
    const successful = results.filter(r => !r.error).length;
    return { message: `Added ${successful}/${results.length} sample organizations`, results };
  };

  const testVerification = async () => {
    const results = await testMessageVerification();
    const successful = results.filter(r => r.result?.is_valid).length;
    return { message: `${successful}/${results.length} verifications successful`, results };
  };

  const testSingleVerification = async () => {
    const result = await verifyMessage(
      'Test message for verification',
      'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef123456',
      '0x1111111111111111111111111111111111111111'
    );
    return result;
  };

  const clearResults = () => {
    setResults([]);
  };

  const TestButton = ({ title, onPress, icon }: { title: string; onPress: () => void; icon: React.ReactNode }) => (
    <Pressable
      style={[styles.testButton, { backgroundColor: colors.primary }]}
      onPress={onPress}
      disabled={loading}
    >
      {icon}
      <Text style={styles.testButtonText}>{title}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Supabase Test Panel</Text>
      
      <View style={styles.buttonGrid}>
        <TestButton
          title="Test Connection"
          onPress={() => runTest('Supabase Connection', testSupabaseConnection)}
          icon={<Database size={20} color="white" />}
        />
        
        <TestButton
          title="Add Sample Data"
          onPress={() => runTest('Add Sample Organizations', addSampleData)}
          icon={<Users size={20} color="white" />}
        />
        
        <TestButton
          title="Test Verification"
          onPress={() => runTest('Message Verification', testVerification)}
          icon={<TestTube size={20} color="white" />}
        />
        
        <TestButton
          title="Single Verify"
          onPress={() => runTest('Single Verification', testSingleVerification)}
          icon={<CheckCircle size={20} color="white" />}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>Test Results</Text>
        <Pressable onPress={clearResults} style={[styles.clearButton, { backgroundColor: colors.error }]}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {results.length === 0 ? (
          <Text style={[styles.noResults, { color: colors.textSecondary }]}>
            No test results yet. Run a test to see results here.
          </Text>
        ) : (
          results.map((result, index) => (
            <View key={index} style={[styles.resultCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.resultHeader}>
                {result.success ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <AlertCircle size={16} color={colors.error} />
                )}
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  {result.testName}
                </Text>
                <Text style={[styles.resultTime, { color: colors.textSecondary }]}>
                  {result.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              
              <Text style={[styles.resultMessage, { 
                color: result.success ? colors.success : colors.error 
              }]}>
                {result.result?.message || result.error || 'Test completed'}
              </Text>
              
              {result.result?.data && (
                <Text style={[styles.resultData, { color: colors.textSecondary }]}>
                  Data: {JSON.stringify(result.result.data, null, 2).substring(0, 200)}...
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background + 'CC' }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Running test...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  testButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  resultsContainer: {
    flex: 1,
  },
  noResults: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 40,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  resultTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  resultMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  resultData: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});