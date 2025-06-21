import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  Moon,
  Sun,
  Smartphone,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Shield,
  Bell,
  BellOff,
  Info,
  Trash2,
  Download,
  RefreshCw,
  ChevronRight,
} from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useVerification } from "../contexts/VerificationContext"
import { voiceService } from "../services/VoiceService"
import { blockchainService } from "../services/BlockchainService"

export default function SettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme()
  const { enableVoiceFeedback, setEnableVoiceFeedback, offlineMode, setOfflineMode, messages } = useVerification()

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [blockchainStatus, setBlockchainStatus] = useState<{
    connected: boolean
    provider?: string
    blockNumber?: number
    latency?: number
    error?: string
  }>({ connected: false })
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState(voiceService.getStatus())
  const [testingVoice, setTestingVoice] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<any[]>([])

  useEffect(() => {
    checkBlockchainConnection()
    updateVoiceStatus()
    loadAvailableVoices()
  }, [])

  const updateVoiceStatus = () => {
    setVoiceStatus(voiceService.getStatus())
  }

  const loadAvailableVoices = async () => {
    try {
      const voices = await voiceService.getAvailableVoices()
      setAvailableVoices(voices)
    } catch (error) {
      console.error("Error loading voices:", error)
      setAvailableVoices([])
    }
  }

  const checkBlockchainConnection = async () => {
    try {
      setCheckingConnection(true)
      const status = await blockchainService.checkConnection()
      setBlockchainStatus(status)
    } catch (error) {
      console.error("Error checking blockchain connection:", error)
      setBlockchainStatus({
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error checking connection",
      })
    } finally {
      setCheckingConnection(false)
    }
  }

  const testVoiceFeedback = async () => {
    try {
      setTestingVoice(true)

      if (!enableVoiceFeedback) {
        Alert.alert("Voice Feedback Disabled", "Please enable voice feedback first")
        return
      }

      console.log("Testing voice feedback...")
      console.log("Voice status:", voiceService.getStatus())

      const success = await voiceService.testVoice()
      console.log("Voice test result:", success)

      if (success) {
        Alert.alert("Voice Test Successful", "Voice feedback is working correctly!")
      } else {
        Alert.alert(
          "Voice Test Failed",
          "Voice feedback is not working. This could be due to:\n\n• Device audio settings\n• No voices available\n• Audio output issues\n\nTry checking your device's text-to-speech settings.",
        )
      }
    } catch (error) {
      console.error("Voice feedback test error:", error)
      Alert.alert("Error", `Failed to test voice feedback: ${error.message}`)
    } finally {
      setTestingVoice(false)
    }
  }

  const handleVoiceFeedbackToggle = (enabled: boolean) => {
    setEnableVoiceFeedback(enabled)
    updateVoiceStatus()

    if (enabled && !voiceService.isAvailable()) {
      Alert.alert(
        "Voice Service Unavailable",
        "Voice feedback is not available on this device. This could be due to:\n\n• Device doesn't support text-to-speech\n• No ElevenLabs API key configured\n• Audio permissions not granted\n\nPlease check your device settings.",
        [{ text: "OK" }],
      )
    }
  }

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  )

  const SettingItem = ({
    icon,
    title,
    description,
    toggle,
    value,
    onValueChange,
    onPress,
    loading,
  }: {
    icon: React.ReactNode
    title: string
    description?: string
    toggle?: boolean
    value?: boolean
    onValueChange?: (value: boolean) => void
    onPress?: () => void
    loading?: boolean
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>{icon}</View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {toggle && onValueChange ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.border, true: colors.primary + "40" }}
            thumbColor={value ? colors.primary : colors.textSecondary}
          />
        ) : (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  )

  const StatusIndicator = ({ connected, label }: { connected: boolean; label: string }) => (
    <View style={styles.statusIndicator}>
      <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.error }]} />
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Customize your verification experience</Text>
        </View>

        {/* Appearance */}
        <SettingSection title="Appearance">
          <SettingItem
            icon={isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
            title="Dark Mode"
            description={`Currently using ${isDark ? "dark" : "light"} theme`}
            toggle
            value={isDark}
            onValueChange={(value) => setTheme(value ? "dark" : "light")}
          />
        </SettingSection>

        {/* Audio & Voice */}
        <SettingSection title="Audio & Voice">
          <SettingItem
            icon={
              enableVoiceFeedback ? (
                <Volume2 size={20} color={colors.primary} />
              ) : (
                <VolumeX size={20} color={colors.textSecondary} />
              )
            }
            title="Voice Feedback"
            description={`Voice feedback is ${enableVoiceFeedback ? "enabled" : "disabled"} • Provider: ${voiceStatus.provider}`}
            toggle
            value={enableVoiceFeedback}
            onValueChange={handleVoiceFeedbackToggle}
          />

          <SettingItem
            icon={<Smartphone size={20} color={colors.primary} />}
            title="Test Voice"
            description={`Test voice functionality • ${availableVoices.length} voices available`}
            onPress={testVoiceFeedback}
            loading={testingVoice}
          />
        </SettingSection>

        {/* Connectivity */}
        <SettingSection title="Connectivity">
          <SettingItem
            icon={
              offlineMode ? <WifiOff size={20} color={colors.warning} /> : <Wifi size={20} color={colors.primary} />
            }
            title="Offline Mode"
            description={offlineMode ? "Using cached data only" : "Online mode active"}
            toggle
            value={offlineMode}
            onValueChange={setOfflineMode}
          />

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Blockchain Status</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {blockchainStatus.connected ? "Connected and ready" : "Connection issues detected"}
                </Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <StatusIndicator
                connected={blockchainStatus.connected}
                label={blockchainStatus.connected ? "Online" : "Offline"}
              />
              <TouchableOpacity onPress={checkBlockchainConnection} disabled={checkingConnection}>
                <RefreshCw size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            icon={
              notificationsEnabled ? (
                <Bell size={20} color={colors.primary} />
              ) : (
                <BellOff size={20} color={colors.textSecondary} />
              )
            }
            title="Push Notifications"
            description="Get notified about verification results"
            toggle
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </SettingSection>

        {/* Data Management */}
        <SettingSection title="Data Management">
          <SettingItem
            icon={<Download size={20} color={colors.primary} />}
            title="Export Data"
            description={`Export ${messages.length} stored messages`}
            onPress={() => Alert.alert("Export Data", "Data export functionality coming soon")}
          />

          <SettingItem
            icon={<Trash2 size={20} color={colors.error} />}
            title="Clear Cache"
            description="Remove all cached verification data"
            onPress={() =>
              Alert.alert("Clear Cache", "Are you sure you want to clear all cached data?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: () => Alert.alert("Success", "Cache cleared") },
              ])
            }
          />
        </SettingSection>

        {/* System Information */}
        <SettingSection title="System Information">
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Info size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>System Status</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Voice Service:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{voiceStatus.provider}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Platform:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{voiceStatus.platform}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Available Voices:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{availableVoices.length}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Blockchain:</Text>
                  <Text
                    style={[styles.infoValue, { color: blockchainStatus.connected ? colors.success : colors.error }]}
                  >
                    {blockchainStatus.connected ? "Connected With Algorand" : "Disconnected"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Messages Stored:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{messages.length}</Text>
                </View>
              </View>
            </View>
          </View>
        </SettingSection>

        {/* Version Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Web3 Message Verifier v1.0.0</Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Built with React Native & Expo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 12,
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  footer: {
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
})
