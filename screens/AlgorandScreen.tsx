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
    ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    Search,
    Wallet,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Coins,
    Network,
    RefreshCw,
    CircleAlert as AlertCircle,
} from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import { algorandService, type AlgorandAccount, type AlgorandTransaction } from "../services/AlgorandService"
import * as Animatable from "react-native-animatable"
import { useNavigation } from "@react-navigation/native"

export default function AlgorandScreen() {
    const { colors } = useTheme()
    const [account, setAccount] = useState<AlgorandAccount | null>(null)
    const [transactions, setTransactions] = useState<AlgorandTransaction[]>([])
    const [searchAddress, setSearchAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [networkStatus, setNetworkStatus] = useState<any>(null)
    const [connectionError, setConnectionError] = useState<string | null>(null)
    const navigation = useNavigation()

    useEffect(() => {
        loadNetworkStatus()
    }, [])

    const loadNetworkStatus = async () => {
        try {
            setConnectionError(null)
            const status = await algorandService.getStatus()
            setNetworkStatus(status)
        } catch (error) {
            console.error("Error loading network status:", error)
            setConnectionError(error.message)
        }
    }

    const searchAccount = async () => {
        if (!searchAddress.trim()) {
            Alert.alert("Error", "Please enter an Algorand address")
            return
        }

        if (!algorandService.isValidAddress(searchAddress.trim())) {
            Alert.alert("Error", "Invalid Algorand address format")
            return
        }

        setLoading(true)
        setConnectionError(null)

        try {
            const accountData = await algorandService.getAccount(searchAddress.trim())
            setAccount(accountData)

            // Load recent transactions
            const txData = await algorandService.getAccountTransactions(searchAddress.trim(), 20)
            setTransactions(txData.transactions)
        } catch (error) {
            console.error("Error searching account:", error)
            setConnectionError(error.message)
            Alert.alert("Error", `Failed to load account information: ${error.message}`)
            setAccount(null)
            setTransactions([])
        } finally {
            setLoading(false)
        }
    }

    const onRefresh = async () => {
        if (!account) return

        setRefreshing(true)
        setConnectionError(null)

        try {
            const accountData = await algorandService.getAccount(account.address)
            setAccount(accountData)

            const txData = await algorandService.getAccountTransactions(account.address, 20)
            setTransactions(txData.transactions)
        } catch (error) {
            console.error("Error refreshing data:", error)
            setConnectionError(error.message)
        } finally {
            setRefreshing(false)
        }
    }

    const testConnection = async () => {
        setLoading(true)
        setConnectionError(null)

        try {
            const result = await algorandService.testConnection()
            if (result.success) {
                Alert.alert("Connection Test", result.message)
                await loadNetworkStatus()
            } else {
                setConnectionError(result.message)
                Alert.alert("Connection Failed", result.message)
            }
        } catch (error) {
            setConnectionError(error.message)
            Alert.alert("Connection Error", error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatAddress = (address: string) => {
        return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString()
    }

    const getTransactionIcon = (transaction: AlgorandTransaction, accountAddress: string) => {
        if (algorandService.isPaymentTransaction(transaction)) {
            const isReceived = transaction["payment-transaction"]?.receiver === accountAddress
            return isReceived ? (
                <ArrowDownLeft size={20} color={colors.success} />
            ) : (
                <ArrowUpRight size={20} color={colors.error} />
            )
        }
        return <Coins size={20} color={colors.primary} />
    }

    const getTransactionAmount = (transaction: AlgorandTransaction) => {
        if (algorandService.isPaymentTransaction(transaction)) {
            return algorandService.getPaymentAmount(transaction)
        }
        if (algorandService.isAssetTransferTransaction(transaction)) {
            const amount = algorandService.getAssetTransferAmount(transaction)
            return amount ? `${amount} ASA` : "Asset Transfer"
        }
        return "N/A"
    }

    const getTransactionType = (transaction: AlgorandTransaction) => {
        switch (transaction["tx-type"]) {
            case "pay":
                return "Payment"
            case "axfer":
                return "Asset Transfer"
            case "acfg":
                return "Asset Config"
            case "afrz":
                return "Asset Freeze"
            case "appl":
                return "Application Call"
            case "keyreg":
                return "Key Registration"
            default:
                return transaction["tx-type"].toUpperCase()
        }
    }

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
    )

    const TransactionCard = ({ transaction, index }: { transaction: AlgorandTransaction; index: number }) => (
        <Animatable.View
            animation="fadeInUp"
            delay={index * 50}
            style={[styles.transactionCard, { backgroundColor: colors.cardBackground }]}
        >
            <View style={styles.transactionHeader}>
                <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: colors.surface }]}>
                        {getTransactionIcon(transaction, account?.address || "")}
                    </View>
                    <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionType, { color: colors.text }]}>{getTransactionType(transaction)}</Text>
                        <Text style={[styles.transactionId, { color: colors.textSecondary }]}>{formatAddress(transaction.id)}</Text>
                    </View>
                </View>
                <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: colors.text }]}>{getTransactionAmount(transaction)}</Text>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                        {formatDate(transaction["round-time"])}
                    </Text>
                </View>
            </View>

            <View style={styles.transactionDetails}>
                <Text style={[styles.transactionDetailText, { color: colors.textSecondary }]}>
                    Round: {transaction["confirmed-round"]} • Fee: {algorandService.getTransactionFeeInAlgo(transaction)}
                </Text>
            </View>
        </Animatable.View>
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Algorand Explorer</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Powered by Nodely.io API</Text>
            </View>

            {/* Network Status */}
            <View style={[styles.networkStatus, { backgroundColor: colors.surface }]}>
                <Network size={16} color={colors.primary} />
                <Text style={[styles.networkText, { color: colors.text }]}>
                    Network: {algorandService.getNetworkConfig().network}
                    {networkStatus && ` • Round: ${networkStatus["last-round"]}`}
                </Text>
                <Pressable onPress={testConnection} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <RefreshCw size={16} color={colors.primary} />
                    )}
                </Pressable>
            </View>

            {/* Connection Error */}
            {connectionError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + "20" }]}>
                    <AlertCircle size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{connectionError}</Text>
                </View>
            )}

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Enter Algorand address..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchAddress}
                    onChangeText={setSearchAddress}
                    onSubmitEditing={searchAccount}
                />
                <Pressable
                    style={[styles.searchButton, { backgroundColor: colors.primary }]}
                    onPress={searchAccount}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search</Text>
                    )}
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {account ? (
                    <>
                        {/* Account Stats */}
                        <View style={styles.statsGrid}>
                            <StatCard
                                icon={<Wallet size={20} color={colors.primary} />}
                                title="Balance"
                                value={algorandService.formatAlgoAmount(account.amount)}
                                subtitle="Available"
                                color={colors.primary}
                                index={0}
                            />
                            <StatCard
                                icon={<TrendingUp size={20} color={colors.success} />}
                                title="Rewards"
                                value={algorandService.formatAlgoAmount(account.rewards)}
                                subtitle="Earned"
                                color={colors.success}
                                index={1}
                            />
                            <StatCard
                                icon={<Coins size={20} color={colors.secondary} />}
                                title="Assets"
                                value={account.assets.length}
                                subtitle="Opted In"
                                color={colors.secondary}
                                index={2}
                            />
                            <StatCard
                                icon={<Clock size={20} color={colors.warning} />}
                                title="Round"
                                value={account.round}
                                subtitle="Last Updated"
                                color={colors.warning}
                                index={3}
                            />
                        </View>

                        {/* Account Details */}
                        <Animatable.View
                            animation="fadeInUp"
                            delay={400}
                            style={[styles.accountDetails, { backgroundColor: colors.cardBackground }]}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Address:</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{formatAddress(account.address)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                                <Text style={[styles.detailValue, { color: colors.success }]}>{account.status}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Min Balance:</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {algorandService.formatAlgoAmount(account["min-balance"])}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Apps Opted In:</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{account["total-apps-opted-in"]}</Text>
                            </View>
                        </Animatable.View>

                        {/* Recent Transactions */}
                        {transactions.length > 0 && (
                            <Animatable.View animation="fadeInUp" delay={500} style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>

                                {transactions.map((transaction, index) => (
                                    <TransactionCard key={transaction.id} transaction={transaction} index={index} />
                                ))}
                            </Animatable.View>
                        )}
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Wallet size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Search Algorand Account</Text>
                        <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                            Enter an Algorand address to view account information, balance, and transaction history
                        </Text>
                        <Pressable
                            style={[styles.exampleButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                setSearchAddress("HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD9ZLDO5SA7UNAI")
                                setTimeout(() => searchAccount(), 100)
                            }}
                        >
                            <Text style={styles.exampleButtonText}>Try Example Address</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.exampleButton, { backgroundColor: colors.secondary, marginTop: 12 }]}
                            onPress={() => navigation.navigate("AlgorandTestData")}
                        >
                            <Text style={styles.exampleButtonText}>View Test Data & Examples</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
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
    networkStatus: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    networkText: {
        flex: 1,
        fontSize: 12,
        fontFamily: "Inter-Medium",
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        fontFamily: "Inter-Regular",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginBottom: 20,
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
    searchButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    searchButtonText: {
        color: "white",
        fontSize: 14,
        fontFamily: "Inter-SemiBold",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        minWidth: "47%",
        maxWidth: "48%",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    statValue: {
        fontSize: 18,
        fontFamily: "Inter-Bold",
        marginBottom: 4,
        textAlign: "center",
    },
    statTitle: {
        fontSize: 12,
        fontFamily: "Inter-Medium",
        textAlign: "center",
    },
    statSubtitle: {
        fontSize: 10,
        fontFamily: "Inter-Regular",
        marginTop: 2,
        textAlign: "center",
    },
    accountDetails: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: "Inter-SemiBold",
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: "Inter-Medium",
    },
    detailValue: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        textAlign: "right",
        flex: 1,
        marginLeft: 16,
    },
    transactionCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 14,
        fontFamily: "Inter-SemiBold",
        marginBottom: 2,
    },
    transactionId: {
        fontSize: 12,
        fontFamily: "Inter-Regular",
    },
    transactionRight: {
        alignItems: "flex-end",
    },
    transactionAmount: {
        fontSize: 14,
        fontFamily: "Inter-SemiBold",
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        fontFamily: "Inter-Regular",
    },
    transactionDetails: {
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    transactionDetailText: {
        fontSize: 11,
        fontFamily: "Inter-Regular",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontFamily: "Inter-SemiBold",
        marginTop: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateSubtitle: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        textAlign: "center",
        lineHeight: 20,
        maxWidth: 280,
        marginBottom: 24,
    },
    exampleButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    exampleButtonText: {
        color: "white",
        fontSize: 16,
        fontFamily: "Inter-SemiBold",
    },
})
