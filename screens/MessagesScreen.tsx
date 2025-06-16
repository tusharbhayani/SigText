import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  MessageSquare,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  RefreshCw,
  Shield,
  Volume2,
} from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import { getMessages, addSampleMessages, type Message } from "../lib/supabase"
import { useVerification } from "../contexts/VerificationContext"
import { voiceService } from "../services/VoiceService"
import * as Animatable from "react-native-animatable"

const { width: screenWidth } = Dimensions.get("window")

export default function MessagesScreen() {
  const { colors } = useTheme()
  const { verifySignature } = useVerification()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await getMessages()

      if (error) {
        console.error("Error loading messages:", error)
        Alert.alert("Error", "Failed to load messages")
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
      Alert.alert("Error", "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMessages()
    setRefreshing(false)
  }

  const addSampleData = async () => {
    try {
      setLoading(true)
      const results = await addSampleMessages()
      const successCount = results.filter((r) => !r.error).length

      Alert.alert("Sample Data", `Added ${successCount}/${results.length} sample messages`, [
        { text: "OK", onPress: loadMessages },
      ])
    } catch (error) {
      console.error("Error adding sample messages:", error)
      Alert.alert("Error", "Failed to add sample messages")
    } finally {
      setLoading(false)
    }
  }

  const verifyMessage = async (message: Message) => {
    try {
      setVerifyingId(message.id)

      // Verify the signature if present
      if (message.signature) {
        const result = await verifySignature(message.content, message.signature)

        Alert.alert(
          result.isValid ? "Verification Successful" : "Verification Failed",
          result.isValid ? "The message signature is valid." : "The message signature could not be verified.",
        )
      } else {
        Alert.alert("No Signature", "This message does not contain a signature to verify.")
      }
    } catch (error) {
      console.error("Error verifying message:", error)
      Alert.alert("Verification Error", "An error occurred while verifying the message")
    } finally {
      setVerifyingId(null)
    }
  }

  const speakMessage = async (message: Message) => {
    try {
      setSpeakingId(message.id)

      // Create a readable version of the message
      const readableText = `Message from ${message.sender}. ${message.content}`

      const success = await voiceService.speak(readableText)

      if (!success) {
        Alert.alert("Voice Error", "Voice service is not available or failed to play audio")
      }
    } catch (error) {
      console.error("Error speaking message:", error)
      Alert.alert("Voice Error", "Failed to read message aloud")
    } finally {
      setSpeakingId(null)
    }
  }

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }

  const renderItem = ({ item }: { item: Message }) => {
    const isVerifying = verifyingId === item.id
    const isSpeaking = speakingId === item.id

    // Format date
    const messageDate = new Date(item.timestamp)
    const formattedDate = messageDate.toLocaleString()

    return (
      <Animatable.View animation="fadeIn" style={[styles.messageCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.messageHeader}>
          <View style={styles.senderContainer}>
            <Text style={[styles.messageSender, { color: colors.text }]} numberOfLines={1}>
              {truncateAddress(item.sender)}
            </Text>
            <TouchableOpacity
              style={[styles.speakButton, { backgroundColor: colors.primary + "20" }]}
              onPress={() => speakMessage(item)}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Volume2 size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.messageDate, { color: colors.textSecondary }]}>{formattedDate}</Text>
        </View>

        <Text style={[styles.messageBody, { color: colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.messageFooter}>
          <View style={styles.statusContainer}>
            {item.signature && (
              <View style={[styles.signatureBadge, { backgroundColor: colors.primary + "20" }]}>
                <Shield size={12} color={colors.primary} />
                <Text style={[styles.signatureText, { color: colors.primary }]}>Has Signature</Text>
              </View>
            )}

            {item.verified !== undefined &&
              (item.verified ? (
                <CheckCircle size={16} color={colors.success} />
              ) : (
                <XCircle size={16} color={colors.error} />
              ))}

            {isVerifying && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {item.signature && (
            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: colors.primary }]}
              onPress={() => verifyMessage(item)}
              disabled={isVerifying}
            >
              <Text style={styles.verifyButtonText}>{isVerifying ? "Verifying..." : "Verify"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animatable.View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {messages.length} messages • {messages.filter((m) => m.verified).length} verified
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
            keyExtractor={(item) => item.id}
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
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  You don't have any messages yet
                </Text>
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                  onPress={addSampleData}
                >
                  <RefreshCw size={16} color="white" />
                  <Text style={styles.refreshButtonText}>Add Sample Messages</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  )
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
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  messageCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  senderContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  messageSender: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    flex: 1,
  },
  speakButton: {
    padding: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  messageDate: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  messageBody: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  signatureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  signatureText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  verifyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  verifyButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "white",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "white",
  },
})
