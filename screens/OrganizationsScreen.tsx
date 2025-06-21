import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  Search,
  Plus,
  Shield,
  CircleCheck as CheckCircle,
  Clock,
  Circle as XCircle,
  ExternalLink,
  Globe,
  Mail,
} from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import { getOrganizations, addSampleOrganizations, type Organization } from "../lib/supabase"
import * as Animatable from "react-native-animatable"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"

const { width: screenWidth } = Dimensions.get("window")

export default function OrganizationsScreen({ navigation, route }: any) {
  const { colors } = useTheme()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "verified" | "pending" | "rejected">("all")
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addingSamples, setAddingSamples] = useState(false)

  // Load organizations when screen comes into focus or when refresh param is passed
  useFocusEffect(
    useCallback(() => {
      loadOrganizations()
    }, []),
  )

  // Also load when route params indicate refresh
  useEffect(() => {
    if (route?.params?.refresh) {
      loadOrganizations()
      // Clear the refresh param
      navigation.setParams({ refresh: undefined })
    }
  }, [route?.params?.refresh])

  useEffect(() => {
    filterOrganizations()
  }, [organizations, searchQuery, filterType])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const { data, error } = await getOrganizations()

      if (error) {
        console.error("Error loading organizations:", error)
        Alert.alert("Error", "Failed to load organizations: " + (error.message || "Unknown error"))
        return
      }

      console.log("Loaded organizations:", data?.length || 0)
      setOrganizations(data || [])
    } catch (error) {
      console.error("Exception in loadOrganizations:", error)
      Alert.alert("Error", "Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }

  const filterOrganizations = () => {
    let filtered = organizations

    // Apply status filter
    if (filterType !== "all") {
      filtered = filtered.filter((org) => org.verification_status === filterType)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.domain?.toLowerCase().includes(query) ||
          org.wallet_address.toLowerCase().includes(query) ||
          org.description?.toLowerCase().includes(query),
      )
    }

    setFilteredOrganizations(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadOrganizations()
    setRefreshing(false)
  }

  const addSampleData = async () => {
    try {
      setAddingSamples(true)
      const results = await addSampleOrganizations()
      const successCount = results.filter((r) => !r.error).length

      Alert.alert("Sample Data", `Added ${successCount}/${results.length} sample organizations`, [
        { text: "OK", onPress: loadOrganizations },
      ])
    } catch (error) {
      console.error("Error adding sample organizations:", error)
      Alert.alert("Error", "Failed to add sample organizations")
    } finally {
      setAddingSamples(false)
    }
  }

  const getStatusIcon = (status: Organization["verification_status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle size={16} color={colors.success} />
      case "pending":
        return <Clock size={16} color={colors.warning} />
      case "rejected":
        return <XCircle size={16} color={colors.error} />
      default:
        return <Clock size={16} color={colors.textSecondary} />
    }
  }

  const getStatusColor = (status: Organization["verification_status"]) => {
    switch (status) {
      case "verified":
        return colors.success
      case "pending":
        return colors.warning
      case "rejected":
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  const getStatusText = (status: Organization["verification_status"]) => {
    switch (status) {
      case "verified":
        return "Verified"
      case "pending":
        return "Pending"
      case "rejected":
        return "Rejected"
      default:
        return "Unknown"
    }
  }

  const FilterButton = ({
    type,
    label,
    icon,
    count,
  }: {
    type: typeof filterType
    label: string
    icon?: React.ReactNode
    count?: number
  }) => {
    const isActive = filterType === type

    return (
      <Pressable
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
          },
        ]}
        onPress={() => setFilterType(type)}
      >
        {icon && <View style={styles.filterIcon}>{icon}</View>}
        <Text style={[styles.filterButtonText, { color: isActive ? "white" : colors.text }]} numberOfLines={1}>
          {label}
        </Text>
        {count !== undefined && (
          <View
            style={[
              styles.filterCount,
              { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : colors.primary + "20" },
            ]}
          >
            <Text style={[styles.filterCountText, { color: isActive ? "white" : colors.primary }]}>{count}</Text>
          </View>
        )}
      </Pressable>
    )
  }

  const OrganizationCard = ({ org, index }: { org: Organization; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={[styles.organizationCard, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orgInfo}>
          {org.logo_url ? (
            <Image source={{ uri: org.logo_url }} style={styles.orgLogo} />
          ) : (
            <View style={[styles.orgLogoPlaceholder, { backgroundColor: colors.primary + "20" }]}>
              <Shield size={20} color={colors.primary} />
            </View>
          )}
          <View style={styles.orgDetails}>
            <Text style={[styles.orgName, { color: colors.text }]}>{org.name}</Text>
            {org.domain && <Text style={[styles.orgDomain, { color: colors.textSecondary }]}>{org.domain}</Text>}
          </View>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(org.verification_status)}
          <Text style={[styles.statusText, { color: getStatusColor(org.verification_status) }]}>
            {getStatusText(org.verification_status)}
          </Text>
        </View>
      </View>

      {org.description && (
        <Text style={[styles.orgDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {org.description}
        </Text>
      )}

      <View style={styles.walletContainer}>
        <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>Wallet Address:</Text>
        <Text style={[styles.walletAddress, { color: colors.text }]} numberOfLines={1}>
          {org.wallet_address}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.orgMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Added {new Date(org.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.cardActions}>
          {org.website_url && (
            <Pressable style={[styles.actionButton, { backgroundColor: colors.surface }]}>
              <ExternalLink size={16} color={colors.primary} />
            </Pressable>
          )}
          {org.contact_email && (
            <Pressable style={[styles.actionButton, { backgroundColor: colors.surface }]}>
              <Mail size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </Animatable.View>
  )

  const EmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyState}>
      <Shield size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Organizations Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery || filterType !== "all"
          ? "Try adjusting your search or filter"
          : "Add your first organization to get started"}
      </Text>
      {!searchQuery && filterType === "all" && (
        <View style={styles.emptyActions}>
          <Pressable
            style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("AddOrganization")}
          >
            <Plus size={20} color="white" />
            <Text style={styles.emptyActionText}>Add Organization</Text>
          </Pressable>
          <Pressable
            style={[styles.emptyActionButton, { backgroundColor: colors.secondary }]}
            onPress={addSampleData}
            disabled={addingSamples}
          >
            {addingSamples ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Globe size={20} color="white" />
                <Text style={styles.emptyActionText}>Add Sample Data</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </Animatable.View>
  )

  // Calculate filter counts
  const getFilterCounts = () => {
    return {
      all: organizations.length,
      verified: organizations.filter((org) => org.verification_status === "verified").length,
      pending: organizations.filter((org) => org.verification_status === "pending").length,
      rejected: organizations.filter((org) => org.verification_status === "rejected").length,
    }
  }

  const counts = getFilterCounts()

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading organizations...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Organizations</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddOrganization")}
        >
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search organizations..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          <FilterButton type="all" label="All" count={counts.all} />
          <FilterButton
            type="verified"
            label="Verified"
            icon={<CheckCircle size={14} color={filterType === "verified" ? "white" : colors.success} />}
            count={counts.verified}
          />
          <FilterButton
            type="pending"
            label="Pending"
            icon={<Clock size={14} color={filterType === "pending" ? "white" : colors.warning} />}
            count={counts.pending}
          />
          <FilterButton
            type="rejected"
            label="Rejected"
            icon={<XCircle size={14} color={filterType === "rejected" ? "white" : colors.error} />}
            count={counts.rejected}
          />
        </ScrollView>
      </View>

      {/* Organizations List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrganizations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                Showing {filteredOrganizations.length} of {organizations.length} organizations
              </Text>
            </View>
            {filteredOrganizations.map((org, index) => (
              <OrganizationCard key={org.id} org={org} index={index} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    minWidth: 80,
  },
  filterIcon: {
    marginRight: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  filterCount: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  organizationCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orgInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  orgLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  orgLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  orgDetails: {
    flex: 1,
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 2,
  },
  orgDomain: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  orgDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  walletContainer: {
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    fontFamily: "monospace",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orgMeta: {
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: screenWidth * 0.8,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyActionText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
})
