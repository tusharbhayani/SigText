import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { QrCode, Copy, Share, Download } from 'lucide-react-native';

interface QRGeneratorProps {
  onGenerate?: (qrData: string) => void;
}

export default function QRGenerator({ onGenerate }: QRGeneratorProps) {
  const { colors } = useTheme();
  const [qrType, setQrType] = useState<'message' | 'organization' | 'contact' | 'transaction'>('message');
  const [formData, setFormData] = useState({
    // Message verification
    message: '',
    signature: '',
    sender: '',
    organizationName: '',
    
    // Organization info
    orgName: '',
    domain: '',
    walletAddress: '',
    website: '',
    contact: '',
    
    // Contact verification
    contactName: '',
    email: '',
    phone: '',
    contactWallet: '',
    publicKey: '',
    
    // Transaction receipt
    txHash: '',
    amount: '',
    currency: 'ETH',
    fromAddress: '',
    toAddress: '',
    blockNumber: '',
  });

  const generateQRData = () => {
    let qrData: any = {};

    switch (qrType) {
      case 'message':
        qrData = {
          type: 'web3_message',
          message: formData.message,
          signature: formData.signature,
          sender: formData.sender,
          organizationName: formData.organizationName,
          timestamp: Date.now(),
          version: '1.0'
        };
        break;
        
      case 'organization':
        qrData = {
          type: 'organization',
          name: formData.orgName,
          domain: formData.domain,
          walletAddress: formData.walletAddress,
          website: formData.website,
          contact: formData.contact,
          verified: true,
          timestamp: Date.now()
        };
        break;
        
      case 'contact':
        qrData = {
          type: 'contact',
          name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          walletAddress: formData.contactWallet,
          publicKey: formData.publicKey,
          timestamp: Date.now()
        };
        break;
        
      case 'transaction':
        qrData = {
          type: 'transaction',
          txHash: formData.txHash,
          amount: formData.amount,
          currency: formData.currency,
          from: formData.fromAddress,
          to: formData.toAddress,
          blockNumber: formData.blockNumber ? parseInt(formData.blockNumber) : undefined,
          timestamp: Date.now()
        };
        break;
    }

    const qrString = JSON.stringify(qrData);
    onGenerate?.(qrString);
    
    // In a real app, you would generate an actual QR code image here
    Alert.alert('QR Generated', `QR code data:\n${qrString.substring(0, 100)}...`);
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
    multiline = false 
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
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
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>QR Code Generator</Text>
      
      {/* Type Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
        <TypeButton type="message" label="Message" />
        <TypeButton type="organization" label="Organization" />
        <TypeButton type="contact" label="Contact" />
        <TypeButton type="transaction" label="Transaction" />
      </ScrollView>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {qrType === 'message' && (
          <>
            <InputField
              label="Message Content"
              value={formData.message}
              onChangeText={(text) => updateFormData('message', text)}
              placeholder="Enter the message to be verified"
              multiline
            />
            <InputField
              label="Signature"
              value={formData.signature}
              onChangeText={(text) => updateFormData('signature', text)}
              placeholder="0x1234567890abcdef..."
            />
            <InputField
              label="Sender Address"
              value={formData.sender}
              onChangeText={(text) => updateFormData('sender', text)}
              placeholder="0x1234567890123456789012345678901234567890"
            />
            <InputField
              label="Organization Name"
              value={formData.organizationName}
              onChangeText={(text) => updateFormData('organizationName', text)}
              placeholder="Acme Bank"
            />
          </>
        )}

        {qrType === 'organization' && (
          <>
            <InputField
              label="Organization Name"
              value={formData.orgName}
              onChangeText={(text) => updateFormData('orgName', text)}
              placeholder="Acme Corporation"
            />
            <InputField
              label="Domain"
              value={formData.domain}
              onChangeText={(text) => updateFormData('domain', text)}
              placeholder="acme.com"
            />
            <InputField
              label="Wallet Address"
              value={formData.walletAddress}
              onChangeText={(text) => updateFormData('walletAddress', text)}
              placeholder="0x1234567890123456789012345678901234567890"
            />
            <InputField
              label="Website"
              value={formData.website}
              onChangeText={(text) => updateFormData('website', text)}
              placeholder="https://acme.com"
            />
            <InputField
              label="Contact Email"
              value={formData.contact}
              onChangeText={(text) => updateFormData('contact', text)}
              placeholder="contact@acme.com"
            />
          </>
        )}

        {qrType === 'contact' && (
          <>
            <InputField
              label="Name"
              value={formData.contactName}
              onChangeText={(text) => updateFormData('contactName', text)}
              placeholder="John Doe"
            />
            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="john@example.com"
            />
            <InputField
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              placeholder="+1234567890"
            />
            <InputField
              label="Wallet Address"
              value={formData.contactWallet}
              onChangeText={(text) => updateFormData('contactWallet', text)}
              placeholder="0x1234567890123456789012345678901234567890"
            />
            <InputField
              label="Public Key"
              value={formData.publicKey}
              onChangeText={(text) => updateFormData('publicKey', text)}
              placeholder="04a34b99f22c790c4e36b2b3c2c35a36db06226e..."
            />
          </>
        )}

        {qrType === 'transaction' && (
          <>
            <InputField
              label="Transaction Hash"
              value={formData.txHash}
              onChangeText={(text) => updateFormData('txHash', text)}
              placeholder="0xabcdef1234567890..."
            />
            <InputField
              label="Amount"
              value={formData.amount}
              onChangeText={(text) => updateFormData('amount', text)}
              placeholder="1.5"
            />
            <InputField
              label="Currency"
              value={formData.currency}
              onChangeText={(text) => updateFormData('currency', text)}
              placeholder="ETH"
            />
            <InputField
              label="From Address"
              value={formData.fromAddress}
              onChangeText={(text) => updateFormData('fromAddress', text)}
              placeholder="0x1234567890123456789012345678901234567890"
            />
            <InputField
              label="To Address"
              value={formData.toAddress}
              onChangeText={(text) => updateFormData('toAddress', text)}
              placeholder="0x0987654321098765432109876543210987654321"
            />
            <InputField
              label="Block Number"
              value={formData.blockNumber}
              onChangeText={(text) => updateFormData('blockNumber', text)}
              placeholder="18500000"
            />
          </>
        )}

        <Pressable
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={generateQRData}
        >
          <QrCode size={20} color="white" />
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    textAlign: 'center',
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
    marginBottom: 40,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});