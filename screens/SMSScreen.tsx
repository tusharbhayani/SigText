import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, CircleCheck as CheckCircle, Circle as XCircle, Clock, RefreshCw, Shield } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { smsService } from '../services/SMSService';
import { useVerification } from '../contexts/VerificationContext';
import * as Animatable from 'react-native-animatable';

interface SMS {
  _id: string;
  address: string;
  body: string;
  date: number;
  type: number;
  read: number;
  verified?: boolean | null;
  hasSignature?: boolean;
}

export default function SMSScreen() {
  const { colors } = useTheme();
  const { processSMSMessage } = useVerification();
  const [messages, setMessages] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    loadSMSMessages();
  }, []);

  const loadSMSMessages = async () => {
    try {
      setLoading(true);
      const result = await smsService.getSMSMessages(100);

      // Process messages to check for signatures
      const processedMessages = result.messages.map((msg) => ({
        ...msg,
        hasSignature: smsService.containsValidSignature(msg.body),
        verified: null, // Will be set when verified
      }));

      setMessages(processedMessages);
    } catch (error) {
      console.error("Error loading SMS messages:", error);
      Alert.alert("Error", "Failed to load SMS messages");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSMSMessages();
    setRefreshing(false);
  };

  const verifyMessage = async (message: SMS) => {
    try {
      setVerifyingId(message._id);

      // Process the message through the verification system
      const result = await processSMSMessage(message.body, message.address);

      // Update the message in the list with verification result
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === message._id ? { ...msg, verified: result.isValid } : msg))
      );

      // Show result
      if (result.isValid) {
        Alert.alert("Verification Successful", "The message signature is valid.");
      } else {
        Alert.alert("Verification Failed", "The message signature could not be verified.");
      }
    } catch (error) {
      console.error("Error verifying message:", error);
      Alert.alert("Verification Error", "An error occurred while verifying the message");
    } finally {
      setVerifyingId(null);
    }
  };

  const renderItem = ({ item }: { item: SMS }) => {
    const isVerifying = verifyingId === item._id;

    // Format date
    const messageDate = new Date(item.date);
    const formattedDate = messageDate.toLocaleString();

    // Get status icon
    const getStatusIcon = () => {
      if (isVerifying) return <ActivityIndicator size="small" color={colors.primary} />;
      if (!item.hasSignature) return null;
      if (item.verified === true) return <CheckCircle size={16} color={colors.success} />;
      if (item.verified === false) return <XCircle size={16} color={colors.error} />;
      return <Clock size={16} color={colors.warning} />;
    };

    return (
      <Animatable.View animation="fadeIn" style={[styles.messageCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageSender, { color: colors.text }]}>{item.address}</Text>
          <Text style={[styles.messageDate, { color: colors.textSecondary }]}>{formattedDate}</Text>
        </View>

        <Text style={[styles.messageBody, { color: colors.text }]} numberOfLines={3}>
          {item.body}
        </Text>

        <View style={styles.messageFooter}>
          <View style={styles.statusContainer}>
            {item.hasSignature && (
              <View style={[styles.signatureBadge, { backgroundColor: colors.primary + "20" }]}>
                <Shield size={12} color={colors.primary} />
                <Text style={[styles.signatureText, { color: colors.primary }]}>Has Signature</Text>
              </View>
            )}

            {getStatusIcon()}
          </View>

          {item.hasSignature && item.verified === null && (
            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: colors.primary }]}
              onPress={() => verifyMessage(item)}
              disabled={isVerifying}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>SMS Messages</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {messages.length} messages • {messages.filter((m) => m.hasSignature).length} with signatures
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MessageSquare size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No SMS Messages</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No SMS messages were found on your device
                </Text>
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                  onPress={onRefresh}
                >
                  <RefreshCw size={16} color="white" />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  messageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  messageDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  messageBody: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  signatureText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  verifyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  verifyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
});