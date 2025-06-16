import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, MessageSquare, QrCode, Volume2, Activity, Circle as XCircle, CircleCheck as CheckCircle2, Clock } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useVerification } from '../contexts/VerificationContext';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { messages, enableVoiceFeedback, offlineMode, refreshMessages } = useVerification();
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalMessages: 0,
    verifiedMessages: 0,
    rejectedMessages: 0,
    pendingMessages: 0,
    todayMessages: 0,
  });
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    calculateStats();
    setGreeting(getGreeting());
  }, [messages]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const calculateStats = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayMessages = messages.filter((m) => new Date(m.timestamp).setHours(0, 0, 0, 0) === today);

    setStats({
      totalMessages: messages.length,
      verifiedMessages: messages.filter((m) => m.verified === true).length,
      rejectedMessages: messages.filter((m) => m.verified === false).length,
      pendingMessages: messages.filter((m) => m.verified === null).length,
      todayMessages: todayMessages.length,
    });
  };

  const StatCard = ({ icon, title, value, subtitle, color, index }: any) => (
    <Animatable.View
      animation="fadeInUp"
      delay={100 + index * 50}
      style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>{icon}</View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </Animatable.View>
  );

  const QuickAction = ({ icon, title, subtitle, onPress, color, index }: any) => (
    <Animatable.View animation="fadeInUp" delay={300 + index * 100}>
      <Pressable
        style={({ pressed }) => [
          styles.quickAction,
          { backgroundColor: colors.cardBackground },
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onPress}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}>{icon}</View>
        <View style={styles.quickActionContent}>
          <Text style={[styles.quickActionTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </Pressable>
    </Animatable.View>
  );

  const getVerificationIcon = (verified: boolean | null) => {
    if (verified === null) return <Clock size={12} color="white" />;
    return verified ? <CheckCircle2 size={12} color="white" /> : <XCircle size={12} color="white" />;
  };

  const getVerificationColor = (verified: boolean | null) => {
    if (verified === null) return colors.warning;
    return verified ? colors.success : colors.error;
  };

  const getVerificationText = (verified: boolean | null) => {
    if (verified === null) return "Pending";
    return verified ? "Verified" : "Unverified";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? [colors.background, colors.surface] : [colors.primary + "08", colors.background]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refreshMessages}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
                <Text style={[styles.title, { color: colors.text }]}>Message Verifier</Text>
              </View>
              <View
                style={[styles.statusIndicator, { backgroundColor: offlineMode ? colors.warning : colors.success }]}
              >
                <Activity size={16} color="white" />
              </View>
            </View>
          </Animatable.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Shield size={20} color={colors.primary} />}
              title="Total"
              value={stats.totalMessages}
              subtitle="Messages"
              color={colors.primary}
              index={0}
            />
            <StatCard
              icon={<CheckCircle2 size={20} color={colors.success} />}
              title="Verified"
              value={stats.verifiedMessages}
              subtitle="Trusted"
              color={colors.success}
              index={1}
            />
            <StatCard
              icon={<XCircle size={20} color={colors.error} />}
              title="Rejected"
              value={stats.rejectedMessages}
              subtitle="Invalid"
              color={colors.error}
              index={2}
            />
            <StatCard
              icon={<Clock size={20} color={colors.warning} />}
              title="Pending"
              value={stats.pendingMessages}
              subtitle="Processing"
              color={colors.warning}
              index={3}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

            <QuickAction
              icon={<QrCode size={24} color={colors.primary} />}
              title="Scan QR Code"
              subtitle="Verify signed message payload"
              color={colors.primary}
              onPress={() => navigation.navigate("Scanner" as never)}
              index={0}
            />

            <QuickAction
              icon={<MessageSquare size={24} color={colors.secondary} />}
              title="View Messages"
              subtitle="Browse all SMS and verified messages"
              color={colors.secondary}
              onPress={() => navigation.navigate("Messages" as never)}
              index={1}
            />

            <QuickAction
              icon={<Volume2 size={24} color={colors.success} />}
              title="Voice Feedback"
              subtitle={enableVoiceFeedback ? "Enabled" : "Disabled"}
              color={colors.success}
              onPress={() => navigation.navigate("Settings" as never)}
              index={2}
            />
          </View>

          {/* Recent Messages */}
          {messages.length > 0 && (
            <Animatable.View animation="fadeInUp" delay={600} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Messages</Text>
                <Pressable onPress={() => navigation.navigate("Messages" as never)}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                </Pressable>
              </View>

              {messages.slice(0, 3).map((message, index) => (
                <Animatable.View key={message.id} animation="fadeInUp" delay={700 + index * 100}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.messageCard,
                      { backgroundColor: colors.cardBackground },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => navigation.navigate("Messages" as never)}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.messageHeaderLeft}>
                        <View
                          style={[
                            styles.verificationBadge,
                            { backgroundColor: getVerificationColor(message.verified) },
                          ]}
                        >
                          {getVerificationIcon(message.verified)}
                        </View>
                        <Text style={[styles.messageStatus, { color: getVerificationColor(message.verified) }]}>
                          {getVerificationText(message.verified)}
                        </Text>
                      </View>
                      <View style={styles.messageTime}>
                        <Text style={[styles.messageTimeText, { color: colors.textSecondary }]}>
                          {new Date(message.timestamp).toLocaleDateString()}
                        </Text>
                        {message.type && (
                          <View style={[styles.messageTypeTag, { backgroundColor: colors.primary + "20" }]}>
                            <Text style={[styles.messageTypeText, { color: colors.primary }]}>{message.type}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.messageContent, { color: colors.text }]} numberOfLines={2}>
                      {message.content}
                    </Text>
                    {message.sender && (
                      <Text style={[styles.messageSender, { color: colors.textSecondary }]}>
                        From: {message.sender}
                      </Text>
                    )}
                  </Pressable>
                </Animatable.View>
              ))}
            </Animatable.View>
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <Animatable.View animation="fadeInUp" delay={600} style={styles.emptyState}>
              <MessageSquare size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Messages Yet</Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                SMS messages will appear here automatically when received. You can also scan QR codes to verify messages
                manually.
              </Text>
            </Animatable.View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  messageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageStatus: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  messageTime: {
    alignItems: 'flex-end',
    gap: 4,
  },
  messageTimeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  messageTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  messageTypeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  messageContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});