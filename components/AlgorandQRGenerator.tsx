import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { QrCode, Copy, Share, Download, Coins } from 'lucide-react-native';
import { algorandService } from '../services/AlgorandService';

interface AlgorandQRGeneratorProps {
  onGenerate?: (qrData: string) => void;
}

export default function AlgorandQRGenerator({ onGenerate }: AlgorandQRGeneratorProps) {
  const { colors } = useTheme();
  const [qrType, setQrType] = useState<'payment' | 'asset_transfer' | 'account_info'>('payment');
  const [formData, setFormData] = useState({
    // Payment
    receiver: '',
    amount: '',
    note: '',

    // Asset Transfer
    assetId: '',
    assetAmount: '',
    assetReceiver: '',

    // Account Info
    accountAddress: '',
    label: '',
  });

  const generateQRData = () => {
    let qrData: any = {};

    switch (qrType) {
      case 'payment':
        if (!formData.receiver || !algorandService.isValidAddress(formData.receiver)) {
          Alert.alert('Error', 'Please enter a valid Algorand address');
          return;
        }

        qrData = {
          type: 'algorand_payment',
          receiver: formData.receiver,
          amount: formData.amount ? parseFloat(formData.amount) * 1000000 : undefined, // Convert to microAlgos
          note: formData.note,
          network: algorandService.getNetworkConfig().network,
          timestamp: Date.now()
        };
        break;

      case 'asset_transfer':
        if (!formData.assetReceiver || !algorandService.isValidAddress(formData.assetReceiver)) {
          Alert.alert('Error', 'Please enter a valid Algorand address');
          return;
        }

        qrData = {
          type: 'algorand_asset_transfer',
          receiver: formData.assetReceiver,
          assetId: parseInt(formData.assetId),
          amount: formData.assetAmount ? parseInt(formData.assetAmount) : undefined,
          note: formData.note,
          network: algorandService.getNetworkConfig().network,
          timestamp: Date.now()
        };
        break;

      case 'account_info':
        if (!formData.accountAddress || !algorandService.isValidAddress(formData.accountAddress)) {
          Alert.alert('Error', 'Please enter a valid Algorand address');
          return;
        }

        qrData = {
          type: 'algorand_account',
          address: formData.accountAddress,
          label: formData.label,
          network: algorandService.getNetworkConfig().network,
          timestamp: Date.now()
        };
        break;
    }

    const qrString = JSON.stringify(qrData);
    onGenerate?.(qrString);

    // In a real app, you would generate an actual QR code image here
    Alert.alert('QR Generated', `Algorand QR code data:\n${qrString.substring(0, 100)}...`);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const TypeButton = ({ type, label }: { type: typeof qrType; label: string }) => (
    <Pressable
      style={[
        styles.typeButton,
        {
          backgroundColor: qrType === type ? colors.primary : colors.surface,
          borderColor: qrType === type ? colors.primary : colors.border,
        }
      ]}
      onPress={() => setQrType(type)}
    >
      <Text style={[
        styles.typeButtonText,
        { color: qrType === type ? 'white' : colors.text }
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    multiline?: boolean;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border,
            height: multiline ? 80 : 44
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Coins size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Algorand QR Generator</Text>
      </View>

      {/* Type Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
        <TypeButton type="payment" label="Payment" />
        <TypeButton type="asset_transfer" label="Asset Transfer" />
        <TypeButton type="account_info" label="Account Info" />
      </ScrollView>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {qrType === 'payment' && (
          <>
            <InputField
              label="Receiver Address"
              value={formData.receiver}
              onChangeText={(text) => updateFormData('receiver', text)}
              placeholder="Enter Algorand address"
            />
            <InputField
              label="Amount (ALGO)"
              value={formData.amount}
              onChangeText={(text) => updateFormData('amount', text)}
              placeholder="0.000000"
              keyboardType="numeric"
            />
            <InputField
              label="Note (Optional)"
              value={formData.note}
              onChangeText={(text) => updateFormData('note', text)}
              placeholder="Payment description"
              multiline
            />
          </>
        )}

        {qrType === 'asset_transfer' && (
          <>
            <InputField
              label="Asset ID"
              value={formData.assetId}
              onChangeText={(text) => updateFormData('assetId', text)}
              placeholder="Enter asset ID"
              keyboardType="numeric"
            />
            <InputField
              label="Receiver Address"
              value={formData.assetReceiver}
              onChangeText={(text) => updateFormData('assetReceiver', text)}
              placeholder="Enter Algorand address"
            />
            <InputField
              label="Amount"
              value={formData.assetAmount}
              onChangeText={(text) => updateFormData('assetAmount', text)}
              placeholder="Asset amount"
              keyboardType="numeric"
            />
            <InputField
              label="Note (Optional)"
              value={formData.note}
              onChangeText={(text) => updateFormData('note', text)}
              placeholder="Transfer description"
              multiline
            />
          </>
        )}

        {qrType === 'account_info' && (
          <>
            <InputField
              label="Account Address"
              value={formData.accountAddress}
              onChangeText={(text) => updateFormData('accountAddress', text)}
              placeholder="Enter Algorand address"
            />
            <InputField
              label="Label (Optional)"
              value={formData.label}
              onChangeText={(text) => updateFormData('label', text)}
              placeholder="Account name or description"
            />
          </>
        )}

        <Pressable
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={generateQRData}
        >
          <QrCode size={20} color="white" />
          <Text style={styles.generateButtonText}>Generate Algorand QR Code</Text>
        </Pressable>

        {/* Network Info */}
        <View style={[styles.networkInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.networkLabel, { color: colors.textSecondary }]}>
            Network: {algorandService.getNetworkConfig().network.toUpperCase()}
          </Text>
          <Text style={[styles.networkNote, { color: colors.textSecondary }]}>
            QR codes generated for {algorandService.getNetworkConfig().network} network
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  formContainer: {
    flex: 1,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  networkInfo: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  networkLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  networkNote: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
});