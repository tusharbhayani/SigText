import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, Zap } from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import { algorandService } from "../services/AlgorandService"
import * as Animatable from "react-native-animatable"

interface TestResult {
    name: string
    status: "pending" | "running" | "success" | "error"
    message: string
    duration?: number
    data?: any
}

export default function AlgorandTestScreen({ navigation }: any) {
    const { colors } = useTheme()
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [currentTest, setCurrentTest] = useState<string | null>(null)

    const tests = [
        {
            id: "network-status",
            name: "Network Status",
            description: "Check Algorand network connectivity and status",
            test: async () => {
                const status = await algorandService.getStatus()
                return {
                    success: !!status,
                    data: status,
                    message: status ? `Connected to round ${status["last-round"]}` : "Failed to connect",
                }
            },
        },
        {
            id: "generate-account",
            name: "Generate Account",
            description: "Test account generation functionality",
            test: async () => {
                const account = await algorandService.generateAccount()
                return {
                    success: !!account,
                    data: account,
                    message: account ? `Generated account: ${account.addr.substring(0, 10)}...` : "Failed to generate account",
                }
            },
        },
        {
            id: "validate-address",
            name: "Address Validation",
            description: "Test address validation with valid and invalid addresses",
            test: async () => {
                const validAddress = "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD9ZLDO5SA7UNAI"
                const invalidAddress = "invalid-address"

                const validResult = algorandService.isValidAddress(validAddress)
                const invalidResult = algorandService.isValidAddress(invalidAddress)

                return {
                    success: validResult && !invalidResult,
                    data: { validResult, invalidResult },
                    message: validResult && !invalidResult ? "Address validation working correctly" : "Address validation failed",
                }
            },
        },
        {
            id: "account-lookup",
            name: "Account Lookup",
            description: "Test account information retrieval",
            test: async () => {
                const testAddress = "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD9ZLDO5SA7UNAI"
                const accountInfo = await algorandService.getAccount(testAddress)

                return {
                    success: !!accountInfo,
                    data: accountInfo,
                    message: accountInfo
                        ? `Account balance: ${algorandService.formatAlgoAmount(accountInfo.amount)}`
                        : "Failed to retrieve account info",
                }
            },
        },
        {
            id: "transaction-history",
            name: "Transaction History",
            description: "Test transaction history retrieval",
            test: async () => {
                const testAddress = "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD9ZLDO5SA7UNAI"
                const transactions = await algorandService.getAccountTransactions(testAddress, 5)

                return {
                    success: !!transactions,
                    data: transactions,
                    message: transactions
                        ? `Retrieved ${transactions.transactions.length} transactions`
                        : "Failed to retrieve transactions",
                }
            },
        },
    ]

    const runSingleTest = async (testId: string) => {
        const test = tests.find((t) => t.id === testId)
        if (!test) return

        setCurrentTest(testId)

        // Update test status to running
        setTestResults((prev) => {
            const existing = prev.find((r) => r.name === test.name)
            if (existing) {
                return prev.map((r) => (r.name === test.name ? { ...r, status: "running" } : r))
            } else {
                return [...prev, { name: test.name, status: "running", message: "Running..." }]
            }
        })

        const startTime = Date.now()

        try {
            const result = await test.test()
            const duration = Date.now() - startTime

            setTestResults((prev) =>
                prev.map((r) =>
                    r.name === test.name
                        ? {
                            ...r,
                            status: result.success ? "success" : "error",
                            message: result.message,
                            duration,
                            data: result.data,
                        }
                        : r,
                ),
            )
        } catch (error) {
            const duration = Date.now() - startTime

            setTestResults((prev) =>
                prev.map((r) =>
                    r.name === test.name
                        ? {
                            ...r,
                            status: "error",
                            message: error instanceof Error ? error.message : "Unknown error",
                            duration,
                        }
                        : r,
                ),
            )
        } finally {
            setCurrentTest(null)
        }
    }

    const runAllTests = async () => {
        setIsRunning(true)
        setTestResults([])

        for (const test of tests) {
            await runSingleTest(test.id)
            // Small delay between tests
            await new Promise((resolve) => setTimeout(resolve, 500))
        }

        setIsRunning(false)

        // Show summary
        const successCount = testResults.filter((r) => r.status === "success").length
        const totalCount = tests.length

        Alert.alert(
            "Test Results",
            `Completed ${totalCount} tests\n✅ ${successCount} passed\n❌ ${totalCount - successCount} failed`,
            [{ text: "OK" }],
        )
    }

    const getStatusIcon = (status: TestResult["status"]) => {
        switch (status) {
            case "running":
                return <ActivityIndicator size="small" color={colors.primary} />
            case "success":
                return <CheckCircle size={20} color={colors.success} />
            case "error":
                return <XCircle size={20} color={colors.error} />
            default:
                return <Clock size={20} color={colors.textSecondary} />
        }
    }

    const getStatusColor = (status: TestResult["status"]) => {
        switch (status) {
            case "success":
                return colors.success
            case "error":
                return colors.error
            case "running":
                return colors.primary
            default:
                return colors.textSecondary
        }
    }

    const TestCard = ({ test, result }: { test: any; result?: TestResult }) => (
        <Animatable.View animation="fadeInUp" style={[styles.testCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.testHeader}>
                <View style={styles.testInfo}>
                    <Text style={[styles.testName, { color: colors.text }]}>{test.name}</Text>
                    <Text style={[styles.testDescription, { color: colors.textSecondary }]}>{test.description}</Text>
                </View>

                <View style={styles.testStatus}>{getStatusIcon(result?.status || "pending")}</View>
            </View>

            {result && (
                <View style={styles.testResult}>
                    <Text style={[styles.testMessage, { color: getStatusColor(result.status) }]}>{result.message}</Text>
                    {result.duration && (
                        <Text style={[styles.testDuration, { color: colors.textSecondary }]}>Duration: {result.duration}ms</Text>
                    )}
                </View>
            )}

            <Pressable
                style={[styles.runButton, { backgroundColor: colors.primary }]}
                onPress={() => runSingleTest(test.id)}
                disabled={isRunning || currentTest === test.id}
            >
                <Play size={16} color="white" />
                <Text style={styles.runButtonText}>{currentTest === test.id ? "Running..." : "Run Test"}</Text>
            </Pressable>
        </Animatable.View>
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={20} color={colors.text} />
                </Pressable>

                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: colors.text }]}>Algorand Tests</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Test Algorand service functionality</Text>
                </View>
            </View>

            {/* Run All Button */}
            <View style={styles.runAllContainer}>
                <Pressable
                    style={[styles.runAllButton, { backgroundColor: colors.primary }, isRunning && styles.runAllButtonDisabled]}
                    onPress={runAllTests}
                    disabled={isRunning}
                >
                    {isRunning ? <ActivityIndicator size="small" color="white" /> : <Zap size={20} color="white" />}
                    <Text style={styles.runAllButtonText}>{isRunning ? "Running Tests..." : "Run All Tests"}</Text>
                </Pressable>
            </View>

            {/* Test Results */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {tests.map((test) => {
                    const result = testResults.find((r) => r.name === test.name)
                    return <TestCard key={test.id} test={test} result={result} />
                })}
            </ScrollView>
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
        padding: 20,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: "Inter-Bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
    },
    runAllContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    runAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    runAllButtonDisabled: {
        opacity: 0.6,
    },
    runAllButtonText: {
        color: "white",
        fontSize: 16,
        fontFamily: "Inter-SemiBold",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    testCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    testHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    testInfo: {
        flex: 1,
        marginRight: 12,
    },
    testName: {
        fontSize: 16,
        fontFamily: "Inter-SemiBold",
        marginBottom: 4,
    },
    testDescription: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        lineHeight: 20,
    },
    testStatus: {
        alignItems: "center",
        justifyContent: "center",
    },
    testResult: {
        marginBottom: 12,
    },
    testMessage: {
        fontSize: 14,
        fontFamily: "Inter-Medium",
        marginBottom: 4,
    },
    testDuration: {
        fontSize: 12,
        fontFamily: "Inter-Regular",
    },
    runButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    runButtonText: {
        color: "white",
        fontSize: 14,
        fontFamily: "Inter-Medium",
    },
})
