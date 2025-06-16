import type React from "react"
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

const { width: screenWidth } = Dimensions.get("window")

export default function OrganizationsScreen({ navigation }: any) {
  const { colors } = useTheme()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "verified" | "pending" | "rejected">("all")
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addingSamples, setAddingSamples] = useState(false)

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    filterOrganizations()
  }, [organizations, searchQuery, filterType])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const { data, error } = await getOrganizations()

      if (error) {
        console.error("Error loading organizations:", error)
        Alert.alert("Error", "Failed to load organizations")
        return
      }

      setOrganizations(data || [])
    } catch (error) {
      console.error("Error loading organizations:", error)
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

  const openWebsite = (url?: string) => {
    if (url) {
      Alert.alert("Website", `Would open: ${url}`)
    }
  }

  const copyWalletAddress = (address: string) => {
    Alert.alert("Copied", `Wallet address copied: ${address.substring(0, 10)}...`)
  }

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
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

  const OrganizationCard = ({ organization, index }: { organization: Organization; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      style={[styles.organizationCard, { backgroundColor: colors.cardBackground }]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {organization.logo_url ? (
            <Image source={{ uri: organization.logo_url }} style={styles.organizationLogo} />
          ) : (
            <View style={[styles.organizationLogo, { backgroundColor: colors.primary + "20" }]}>
              <Shield size={24} color={colors.primary} />
            </View>
          )}
          <View style={styles.organizationInfo}>
            <Text style={[styles.organizationName, { color: colors.text }]} numberOfLines={1}>
              {organization.name}
            </Text>
            {organization.domain && (
              <Text style={[styles.organizationDomain, { color: colors.textSecondary }]} numberOfLines={1}>
                {organization.domain}
              </Text>
            )}
          </View>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(organization.verification_status) + "20" }]}
        >
          {getStatusIcon(organization.verification_status)}
          <Text style={[styles.statusText, { color: getStatusColor(organization.verification_status) }]}>
            {getStatusText(organization.verification_status)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {organization.description && (
        <Text style={[styles.organizationDescription, { color: colors.text }]} numberOfLines={2}>
          {organization.description}
        </Text>
      )}

      {/* Wallet Address */}
      <Pressable style={styles.walletContainer} onPress={() => copyWalletAddress(organization.wallet_address)}>
        <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>Wallet:</Text>
        <Text style={[styles.walletAddress, { color: colors.primary }]}>
          {truncateAddress(organization.wallet_address)}
        </Text>
      </Pressable>

      {/* Actions */}
      <View style={styles.cardActions}>
        {organization.website_url && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => openWebsite(organization.website_url)}
          >
            <Globe size={14} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Website</Text>
          </Pressable>
        )}

        {organization.contact_email && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => Alert.alert("Contact", organization.contact_email)}
          >
            <Mail size={14} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Contact</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary + "20" }]}
          onPress={() => Alert.alert("Details", `Organization ID: ${organization.id}`)}
        >
          <ExternalLink size={14} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Details</Text>
        </Pressable>
      </View>

      {/* Metadata */}
      <View style={styles.cardMetadata}>
        <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
          Created: {new Date(organization.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Animatable.View>
  )

  const getFilterCounts = () => {
    return {
      all: organizations.length,
      verified: organizations.filter((org) => org.verification_status === "verified").length,
      pending: organizations.filter((org) => org.verification_status === "pending").length,
      rejected: organizations.filter((org) => org.verification_status === "rejected").length,
    }
  }

  const counts = getFilterCounts()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Organizations</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddOrganization")}
        >
          <Plus size={18} color="white" />
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading organizations...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.organizationsList}
          contentContainerStyle={styles.organizationsListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org, index) => (
              <OrganizationCard key={org.id} organization={org} index={index} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Shield size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Organizations Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery || filterType !== "all"
                  ? "Try changing your search or filters"
                  : "Add your first organization to get started"}
              </Text>

              <View style={styles.emptyActions}>
                <Pressable
                  style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate("AddOrganization")}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.emptyActionButtonText}>Add Organization</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.emptyActionButton,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={addSampleData}
                  disabled={addingSamples}
                >
                  {addingSamples ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Shield size={20} color={colors.text} />
                      <Text style={[styles.emptyActionButtonText, { color: colors.text }]}>Add Sample Data</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 8,
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
  organizationsList: {
    flex: 1,
  },
  organizationsListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  organizationCard: {
    borderRadius: 16,
    padding: 16,
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
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  organizationLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  organizationInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 2,
  },
  organizationDomain: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  organizationDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  walletContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  walletLabel: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginRight: 8,
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    flex: 1,
    minWidth: 80,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  cardMetadata: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 12,
  },
  metadataText: {
    fontSize: 12,
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
  emptyActions: {
    gap: 12,
    width: "100%",
    maxWidth: 300,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyActionButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "white",
  },
})