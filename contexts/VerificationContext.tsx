import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabaseVerificationService } from "../services/SupabaseVerificationService"
import { getVerifiedMessages, subscribeToVerifiedMessages, addSampleMessages } from "../lib/supabase"
import { Platform } from "react-native"
import { dataSyncService } from "../services/DataSyncService"

// Safe locale detection for web platform
const getDeviceLocale = () => {
  try {
    if (Platform.OS === "web") {
      return navigator.language || "en-US"
    }
    // For mobile, use a default
    return "en-US"
  } catch (error) {
    console.warn("Could not get device locale, using default:", error)
    return "en-US"
  }
}

interface Message {
  id: string
  content: string
  signature?: string
  timestamp: number
  verified: boolean | null // null = pending verification
  sender?: string
  hash?: string
  type?: "SMS" | "QR" | "MANUAL"
  organizationId?: string
  organizationName?: string
  verificationDetails?: {
    blockNumber?: number
    chainId?: number
    did?: string
    transactionHash?: string
    organizationInfo?: any
  }
}

interface VerificationContextType {
  messages: Message[]
  addMessage: (message: Omit<Message, "id" | "timestamp">) => Promise<void>
  verifySignature: (content: string, signature: string, sender?: string) => Promise<any>
  enableVoiceFeedback: boolean
  setEnableVoiceFeedback: (enabled: boolean) => void
  offlineMode: boolean
  setOfflineMode: (enabled: boolean) => void
  refreshMessages: () => Promise<void>
  processSMSMessage: (messageText: string, sender?: string) => Promise<any>
  verifyQRMessage: (qrData: string) => Promise<boolean>
  getVerificationHistory: () => Promise<any[]>
  isLoading: boolean
  error: string | null
  clearError: () => void
  addSampleData: () => Promise<void>
  syncStatus: any
  forcSync: () => Promise<void>
  getSyncStatus: () => Promise<any>
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [enableVoiceFeedback, setEnableVoiceFeedbackState] = useState(true)
  const [offlineMode, setOfflineModeState] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<any>(null)

  // Get device locale safely
  const deviceLocale = getDeviceLocale()

  useEffect(() => {
    loadMessages()
    loadSettings()
    setupRealtimeSubscription()

    // Start auto sync
    dataSyncService.startAutoSync()

    // Get initial sync status
    dataSyncService.getSyncStatus().then(setSyncStatus)

    return () => {
      dataSyncService.stopAutoSync()
    }
  }, [])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load from Supabase
      const { data: supabaseMessages, error: fetchError } = await getVerifiedMessages(100)

      if (fetchError) {
        console.error("Error loading messages from Supabase:", fetchError)
        // Fall back to local storage
        await loadLocalMessages()
        return
      }

      // Convert Supabase messages to local format
      const convertedMessages: Message[] = (supabaseMessages || []).map((msg) => ({
        id: msg.id,
        content: msg.message_content,
        signature: msg.signature,
        timestamp: new Date(msg.created_at).getTime(),
        verified: msg.verification_status === "verified" ? true : msg.verification_status === "failed" ? false : null,
        sender: msg.sender_address,
        hash: msg.message_hash || undefined,
        type: "MANUAL", // Default type
        organizationId: msg.organization_id || undefined,
        organizationName: msg.organization?.name || undefined,
        verificationDetails: {
          ...msg.verification_details,
          organizationInfo: msg.organization,
        },
      }))

      setMessages(convertedMessages)

      // Also save to local storage for offline access
      await AsyncStorage.setItem("messages", JSON.stringify(convertedMessages))
    } catch (error) {
      console.error("Error loading messages:", error)
      setError("Failed to load messages")
      await loadLocalMessages()
    } finally {
      setIsLoading(false)
    }
  }

  const loadLocalMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem("messages")
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      }
    } catch (error) {
      console.error("Error loading local messages:", error)
    }
  }

  const loadSettings = async () => {
    try {
      const voiceFeedback = await AsyncStorage.getItem("enableVoiceFeedback")
      const offlineModeEnabled = await AsyncStorage.getItem("offlineMode")

      if (voiceFeedback !== null) {
        setEnableVoiceFeedbackState(JSON.parse(voiceFeedback))
      }
      if (offlineModeEnabled !== null) {
        setOfflineModeState(JSON.parse(offlineModeEnabled))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const setupRealtimeSubscription = () => {
    try {
      const subscription = subscribeToVerifiedMessages((payload) => {
        console.log("Real-time message update:", payload)

        if (payload.eventType === "INSERT") {
          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.message_content,
            signature: payload.new.signature,
            timestamp: new Date(payload.new.created_at).getTime(),
            verified:
              payload.new.verification_status === "verified"
                ? true
                : payload.new.verification_status === "failed"
                  ? false
                  : null,
            sender: payload.new.sender_address,
            hash: payload.new.message_hash || undefined,
            type: "MANUAL",
            organizationId: payload.new.organization_id || undefined,
            verificationDetails: payload.new.verification_details,
          }

          setMessages((prev) => [newMessage, ...prev])
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up real-time subscription:", error)
      return () => { } // Return empty cleanup function
    }
  }

  const processSMSMessage = async (messageText: string, sender?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const verificationResult = await supabaseVerificationService.verifySMSMessage(messageText, sender)

      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        timestamp: Date.now(),
        verified: verificationResult.isValid,
        sender: sender,
        type: "SMS",
        organizationId: verificationResult.organizationId,
        organizationName: verificationResult.organizationName,
        verificationDetails: verificationResult.verificationDetails,
      }

      // Add to local state
      const updatedMessages = [newMessage, ...messages]
      setMessages(updatedMessages)

      // Save to local storage
      await AsyncStorage.setItem("messages", JSON.stringify(updatedMessages))

      return verificationResult
    } catch (error) {
      console.error("Error processing SMS message:", error)
      setError("Failed to process SMS message")
      return { isValid: false, error: "Failed to process SMS message" }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyQRMessage = async (qrData: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const verificationResult = await supabaseVerificationService.verifyQRMessage(qrData)

      if (verificationResult.isValid) {
        // QR verification successful - message is already saved by the service
        await refreshMessages() // Refresh to get the latest data
      }

      return verificationResult.isValid
    } catch (error) {
      console.error("Error verifying QR message:", error)
      setError("Failed to verify QR message")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const addMessage = async (messageData: Omit<Message, "id" | "timestamp">) => {
    try {
      const newMessage: Message = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: Date.now(),
      }

      const updatedMessages = [newMessage, ...messages]
      setMessages(updatedMessages)

      await AsyncStorage.setItem("messages", JSON.stringify(updatedMessages))

      // If message has signature and verification is pending, verify it
      if (messageData.signature && messageData.verified === null) {
        const verificationResult = await supabaseVerificationService.verifyMessageSignature(
          messageData.content,
          messageData.signature,
          messageData.sender || "",
          (messageData.type?.toLowerCase() as any) || "manual",
        )

        // Update message with verification result
        await updateMessageVerification(newMessage.id, verificationResult.isValid, {
          organizationId: verificationResult.organizationId,
          organizationName: verificationResult.organizationName,
          verificationDetails: verificationResult.verificationDetails,
        })
      }
    } catch (error) {
      console.error("Error adding message:", error)
      setError("Failed to add message")
    }
  }

  const updateMessageVerification = async (messageId: string, verified: boolean, additionalData?: any) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) =>
        msg.id === messageId
          ? {
            ...msg,
            verified,
            organizationId: additionalData?.organizationId,
            organizationName: additionalData?.organizationName,
            verificationDetails: {
              ...msg.verificationDetails,
              ...additionalData?.verificationDetails,
            },
          }
          : msg,
      )

      // Save to storage
      AsyncStorage.setItem("messages", JSON.stringify(updatedMessages))

      return updatedMessages
    })
  }

  const verifySignature = async (content: string, signature: string, sender?: string): Promise<any> => {
    try {
      const result = await supabaseVerificationService.verifyMessageSignature(
        content,
        signature,
        sender || "",
        "manual",
      )
      return result
    } catch (error) {
      console.error("Signature verification error:", error)
      return { isValid: false, error: "Verification failed" }
    }
  }

  const refreshMessages = async () => {
    await loadMessages()
  }

  const getVerificationHistory = async () => {
    try {
      const { data } = await supabaseVerificationService.getVerificationHistory()
      return data || []
    } catch (error) {
      console.error("Error getting verification history:", error)
      return []
    }
  }

  const addSampleData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const results = await addSampleMessages()
      const hasErrors = results.some((result) => result.error)

      if (hasErrors) {
        console.warn("Some sample messages failed to add:", results)
      }

      // Refresh messages to show the new samples
      await loadMessages()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add sample messages"
      setError(errorMessage)
      console.error("Error adding sample messages:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const setEnableVoiceFeedback = async (enabled: boolean) => {
    setEnableVoiceFeedbackState(enabled)
    try {
      await AsyncStorage.setItem("enableVoiceFeedback", JSON.stringify(enabled))
    } catch (error) {
      console.error("Error saving voice feedback setting:", error)
    }
  }

  const setOfflineMode = async (enabled: boolean) => {
    setOfflineModeState(enabled)
    try {
      await AsyncStorage.setItem("offlineMode", JSON.stringify(enabled))
    } catch (error) {
      console.error("Error saving offline mode setting:", error)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const forcSync = async () => {
    const status = await dataSyncService.forcSync()
    setSyncStatus(status)
    await loadMessages() // Reload after sync
  }

  const getSyncStatus = async () => {
    const status = await dataSyncService.getSyncStatus()
    setSyncStatus(status)
    return status
  }

  return (
    <VerificationContext.Provider
      value={{
        messages,
        addMessage,
        verifySignature,
        enableVoiceFeedback,
        setEnableVoiceFeedback,
        offlineMode,
        setOfflineMode,
        refreshMessages,
        processSMSMessage,
        verifyQRMessage,
        getVerificationHistory,
        isLoading,
        error,
        clearError,
        addSampleData,
        syncStatus,
        forcSync,
        getSyncStatus,
      }}
    >
      {children}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const context = useContext(VerificationContext)
  if (context === undefined) {
    throw new Error("useVerification must be used within a VerificationProvider")
  }
  return context
}
