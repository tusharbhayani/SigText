import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, TestTube, CheckCircle, XCircle, Coins } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { algorandService } from '../services/AlgorandService';
import * as Animatable from 'react-native-animatable';

export default function AlgorandTestDataScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [selectedAddress, setSelectedAddress] = useState('');
    const [testMessage, setTestMessage] = useState('Test message for Algorand verification');
    const [testSignature, setTestSignature] = useState('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
    const [testPublicKey, setTestPublicKey] = useState('04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const testAddresses = algorandService.getTestAddresses();

    const copyToClipboard = (text: string, label: string) => {
        // In a real app, use Clipboard API
        Alert.alert('Copied', `${label} copied to clipboard`);
        console.log('Copied:', text);
    };

    const testAccountLookup = async (address: string) => {
        try {
            setSelectedAddress(address);
            const account = await algorandService.getAccount(address);
            Alert.alert(
                'Account Info',
                `Balance: ${algorandService.formatAlgoAmount(account.amount)}\nStatus: ${account.status}\nAssets: ${account.assets.length}`
            );
        } catch (error) {
            Alert.alert('Error', `Failed to fetch account: ${error.message}`);
        }
    };

    const verifyTestMessage = async () => {
        if (!testMessage || !testSignature || !testPublicKey) {
            Alert.alert('Error', 'Please fill in all test fields');
            return;
        }

        setIsVerifying(true);
        try {
            const result = await algorandService.verifyAlgorandMessage(
                testMessage,
                testSignature,
                testPublicKey
            );
            setVerificationResult(result);
        } catch (error) {
            Alert.alert('Error', `Verification failed: ${error.message}`);
        } finally {
            setIsVerifying(false);
        }
    };

    const AddressCard = ({ address, index }: { address: any; index: number }) => (
        <Animatable.View
            animation="fadeInUp"
            delay={index * 100}
            style={[styles.addressCard, { backgroundColor: colors.cardBackground }]}
        >
            <View style={styles.addressHeader}>
                <View style={styles.addressInfo}>
                    <Text style={[styles.addressLabel, { color: colors.text }]}>{address.label}</Text>
                    <Text style={[styles.addressNetwork, { color: colors.textSecondary }]}>
                        Network: {address.network.toUpperCase()}
                    </Text>
                </View>
                <View style={[styles.networkBadge, {
                    backgroundColor: address.network === 'mainnet' ? colors.success + '20' : colors.primary + '20'
                }]}>
                    <Text style={[styles.networkText, {
                        color: address.network === 'mainnet' ? colors.success : colors.primary
                    }]}>
                        {address.network.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={[styles.addressContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                    {address.address}
                </Text>
            </View>

            <View style={styles.addressDetails}>
                <Text style={[styles.balanceText, { color: colors.text }]}>
                    Balance: {address.balance}
                </Text>
                <Text style={[styles.assetsText, { color: colors.textSecondary }]}>
                    {address.hasAssets ? 'Has Assets' : 'No Assets'}
                </Text>
            </View>

            <View style={styles.addressActions}>
                <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => copyToClipboard(address.address, 'Address')}
                >
                    <Copy size={16} color="white" />
                    <Text style={styles.actionButtonText}>Copy</Text>
                </Pressable>

                <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                    onPress={() => testAccountLookup(address.address)}
                >
                    <TestTube size={16} color="white" />
                    <Text style={styles.actionButtonText}>Test</Text>
                </Pressable>
            </View>
        </Animatable.View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={[styles.backButton, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={20} color={colors.text} />
                </Pressable>

                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: colors.text }]}>Algorand Test Data</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Test addresses and verification
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Test Addresses Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Addresses</Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Use these addresses to test Algorand account lookup and transaction history
                    </Text>

                    {testAddresses.map((address, index) => (
                        <AddressCard key={address.address} address={address} index={index} />
                    ))}
                </View>

                {/* Message Verification Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Message Verification Test</Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Test Algorand message signature verification
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Test Message</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                            value={testMessage}
                            onChangeText={setTestMessage}
                            placeholder="Enter message to verify"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Signature</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                            value={testSignature}
                            onChangeText={setTestSignature}
                            placeholder="Enter signature"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Public Key</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                            value={testPublicKey}
                            onChangeText={setTestPublicKey}
                            placeholder="Enter public key"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <Pressable
                        style={[styles.verifyButton, { backgroundColor: colors.primary }]}
                        onPress={verifyTestMessage}
                        disabled={isVerifying}
                    >
                        <TestTube size={20} color="white" />
                        <Text style={styles.verifyButtonText}>
                            {isVerifying ? 'Verifying...' : 'Verify Message'}
                        </Text>
                    </Pressable>

                    {/* Verification Result */}
                    {verificationResult && (
                        <Animatable.View
                            animation="fadeInUp"
                            style={[styles.resultContainer, { backgroundColor: colors.cardBackground }]}
                        >
                            <View style={styles.resultHeader}>
                                {verificationResult.isValid ? (
                                    <CheckCircle size={24} color={colors.success} />
                                ) : (
                                    <XCircle size={24} color={colors.error} />
                                )}
                                <Text style={[
                                    styles.resultTitle,
                                    { color: verificationResult.isValid ? colors.success : colors.error }
                                ]}>
                                    {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
                                </Text>
                            </View>

                            {verificationResult.details && (
                                <View style={styles.resultDetails}>
                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                        Algorithm: {verificationResult.details.algorithm}
                                    </Text>
                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                        Message Hash: {verificationResult.details.messageHash}
                                    </Text>
                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                        Network: {verificationResult.details.network}
                                    </Text>
                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                        Verified At: {new Date(verificationResult.details.verifiedAt).toLocaleString()}
                                    </Text>
                                </View>
                            )}

                            {verificationResult.error && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    Error: {verificationResult.error}
                                </Text>
                            )}
                        </Animatable.View>
                    )}
                </View>

                {/* Network Info */}
                <View style={[styles.networkInfo, { backgroundColor: colors.surface }]}>
                    <Coins size={20} color={colors.primary} />
                    <View style={styles.networkInfoText}>
                        <Text style={[styles.networkInfoTitle, { color: colors.text }]}>
                            Current Network: {algorandService.getNetworkConfig().network.toUpperCase()}
                        </Text>
                        <Text style={[styles.networkInfoSubtitle, { color: colors.textSecondary }]}>
                            {algorandService.getNetworkConfig().isFreeEndpoint ? 'Free Tier' : 'Paid Tier'} •
                            Nodely.io API
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 16,
        lineHeight: 20,
    },
    addressCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    addressNetwork: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    networkBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    networkText: {
        fontSize: 10,
        fontFamily: 'Inter-Bold',
    },
    addressContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    addressText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    addressDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    balanceText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    assetsText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    addressActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        minHeight: 44,
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    verifyButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    resultContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    resultTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    resultDetails: {
        marginBottom: 8,
    },
    detailText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
    networkInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 40,
        gap: 12,
    },
    networkInfoText: {
        flex: 1,
    },
    networkInfoTitle: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    networkInfoSubtitle: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
});