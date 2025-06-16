import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"
import { createOrganization } from "../lib/supabase"
import { ArrowLeft, Check, Info } from "lucide-react-native"

// Move InputField component outside of the main component
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  required = false,
  colors,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  error?: string
  helperText?: string
  multiline?: boolean
  keyboardType?: any
  autoCapitalize?: any
  required?: boolean
  colors: any
}) => (
  <View style={styles.formGroup}>
    <View style={styles.labelContainer}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
    </View>
    <TextInput
      style={[
        multiline ? styles.textArea : styles.input,
        {
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: error ? colors.error : colors.border,
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? "top" : "center"}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
    {helperText && (
      <View style={styles.helperContainer}>
        <Info size={14} color={colors.textSecondary} />
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>{helperText}</Text>
      </View>
    )}
    {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
  </View>
)

export default function AddOrganizationScreen({ navigation }: any) {
  const { colors } = useTheme()
  const [name, setName] = useState("Verification")
  const [domain, setDomain] = useState("https://verification.com")
  const [description, setDescription] = useState("Verify your identity with Verification App")
  const [walletAddress, setWalletAddress] = useState("0xe688b84b23f322a994A53dbF8E15FA82CDB71127")
  const [publicKey, setPublicKey] = useState("04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd")
  const [websiteUrl, setWebsiteUrl] = useState("https://verification.com")
  const [contactEmail, setContactEmail] = useState("support@verification.com")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Organization name is required"
    }

    if (!walletAddress.trim()) {
      newErrors.walletAddress = "Wallet address is required"
    } else if (!isValidEthereumAddress(walletAddress)) {
      newErrors.walletAddress = "Invalid Ethereum wallet address format"
    }

    if (!publicKey.trim()) {
      newErrors.publicKey = "Public key is required"
    }

    if (domain && !isValidDomain(domain)) {
      newErrors.domain = "Invalid domain format"
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = "Website URL must start with http:// or https://"
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      newErrors.contactEmail = "Invalid email format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEthereumAddress = (address: string): boolean => {
    // Ethereum address validation: starts with 0x and is 42 characters long
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    return ethAddressRegex.test(address)
  }

  const isValidDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    return domainRegex.test(domain)
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith("http://") || url.startsWith("https://")
    } catch {
      return false
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await createOrganization({
        name,
        domain,
        description,
        wallet_address: walletAddress,
        public_key: publicKey,
        website_url: websiteUrl,
        contact_email: contactEmail,
        verification_status: "pending",
      })

      if (error) {
        Alert.alert("Error", "Failed to create organization: " + error.message)
        return
      }

      Alert.alert("Success", "Organization created successfully and pending verification", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("Error creating organization:", error)
      Alert.alert("Error", "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Add Organization</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <InputField
            label="Organization Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter organization name"
            error={errors.name}
            required
            colors={colors}
          />

          <InputField
            label="Domain"
            value={domain}
            onChangeText={setDomain}
            placeholder="example.com"
            error={errors.domain}
            helperText="Your organization's domain name (e.g., company.com)"
            keyboardType="url"
            autoCapitalize="none"
            colors={colors}
          />

          <InputField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the organization"
            multiline
            colors={colors}
          />

          <InputField
            label="Wallet Address"
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="0x1234567890abcdef1234567890abcdef12345678"
            error={errors.walletAddress}
            helperText="Ethereum wallet address (42 characters, starts with 0x)"
            autoCapitalize="none"
            required
            colors={colors}
          />

          <InputField
            label="Public Key"
            value={publicKey}
            onChangeText={setPublicKey}
            placeholder="Enter public key for verification"
            error={errors.publicKey}
            helperText="Public key used for message signature verification"
            autoCapitalize="none"
            required
            colors={colors}
          />

          <InputField
            label="Website URL"
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            placeholder="https://example.com"
            error={errors.websiteUrl}
            helperText="Organization's official website"
            keyboardType="url"
            autoCapitalize="none"
            colors={colors}
          />

          <InputField
            label="Contact Email"
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="contact@example.com"
            error={errors.contactEmail}
            helperText="Primary contact email for the organization"
            keyboardType="email-address"
            autoCapitalize="none"
            colors={colors}
          />

          <View
            style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
          >
            <Info size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              New organizations will be set to "pending" status until verified by an administrator.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Organization</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  helperText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    flex: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "white",
    marginLeft: 8,
  },
})