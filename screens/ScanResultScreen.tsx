import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck as CheckCircle2, Circle as XCircle, Copy, Share as ShareIcon, ArrowLeft, Shield } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

export default function ScanResultScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { result } = route.params as { result: any };

  const copyToClipboard = async (text: string) => {
    // In a real app, use Clipboard API
    console.log('Copied to clipboard:', text);
  };

  const shareResult = async () => {
    try {
      await Share.share({
        message: `QR Scan Result: ${result.message}\n\nData: ${result.data}`,
        title: 'QR Verification Result',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Scan Result</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInUp" style={styles.resultCard}>
          {/* Status Icon */}
          <View style={styles.statusContainer}>
            {result.verified ? (
              <CheckCircle2 size={64} color={colors.success} />
            ) : (
              <XCircle size={64} color={colors.error} />
            )}
          </View>

          {/* Status Text */}
          <Text style={[
            styles.statusTitle,
            { color: result.verified ? colors.success : colors.error }
          ]}>
            {result.verified ? 'Verification Successful' : 'Verification Failed'}
          </Text>

          <Text style={[styles.statusMessage, { color: colors.text }]}>
            {result.message}
          </Text>

          {/* Organization Badge */}
          {result.organizationName && (
            <View style={[styles.organizationBadge, { backgroundColor: colors.primary + '20' }]}>
              <Shield size={16} color={colors.primary} />
              <Text style={[styles.organizationText, { color: colors.primary }]}>
                {result.organizationName}
              </Text>
            </View>
          )}

          {/* Details */}
          {result.details && (
            <View style={[styles.detailsContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.detailsTitle, { color: colors.text }]}>Details</Text>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Scan Time:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(result.details.scanTime).toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {result.details.scanType || result.type}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Method:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {result.details.verificationMethod || 'QR Code'}
                </Text>
              </View>
            </View>
          )}

          {/* Raw Data */}
          <View style={[styles.dataContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dataTitle, { color: colors.text }]}>Raw Data</Text>
            <Text style={[styles.dataText, { color: colors.textSecondary }]} numberOfLines={10}>
              {result.data}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => copyToClipboard(result.data)}
            >
              <Copy size={20} color="white" />
              <Text style={styles.actionButtonText}>Copy Data</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={shareResult}
            >
              <ShareIcon size={20} color="white" />
              <Text style={styles.actionButtonText}>Share Result</Text>
            </Pressable>
          </View>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  organizationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
  },
  organizationText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  detailsContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  dataContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dataTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});