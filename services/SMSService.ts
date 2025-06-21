import { Platform } from 'react-native';

interface ParsedSMS {
  originalMessage: string;
  extractedContent: string;
  signature: string | null;
  sender: string | null;
  timestamp: number;
  metadata: {
    phoneNumber?: string;
    messageId?: string;
    signatureBlock?: string;
    androidVersion?: string;
  };
}

interface SMSSignaturePattern {
  name: string;
  pattern: RegExp;
  extractor: (match: RegExpMatchArray) => string;
}

// Helper function to generate realistic wallet addresses
const generateRealisticWalletAddress = (): string => {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

class SMSService {
  private signaturePatterns: SMSSignaturePattern[] = [
    {
      name: 'standard_hex',
      pattern: /\[SIG:([0-9a-fA-F]{64,})\]/i,
      extractor: (match) => match[1],
    },
    {
      name: 'base64_signature',
      pattern: /\[SIGNATURE:([A-Za-z0-9+/=]{64,})\]/i,
      extractor: (match) => match[1],
    },
    {
      name: 'web3_signature',
      pattern: /\[WEB3SIG:0x([0-9a-fA-F]{128,})\]/i,
      extractor: (match) => '0x' + match[1],
    },
    {
      name: 'did_signature',
      pattern:
        /\[DID:(did:[a-z0-9]+:[a-zA-Z0-9._-]+)#SIG:([0-9a-fA-F]{64,})\]/i,
      extractor: (match) => match[2],
    },
    {
      name: 'ethereum_signature',
      pattern: /\[ETH:0x([0-9a-fA-F]{130})\]/i,
      extractor: (match) => '0x' + match[1],
    },
  ];

  private isAndroid13Plus = false;

  constructor() {
    if (Platform.OS === 'android') {
      this.isAndroid13Plus = (Platform.Version as number) >= 33;
    }
  }

  /**
   * Parse an SMS message and extract signature information
   */
  parseSMSMessage(messageText: string, sender?: string): ParsedSMS {
    const timestamp = Date.now();
    let signature: string | null = null;
    let extractedContent = messageText;
    let signatureBlock: string | null = null;

    // Try each signature pattern
    for (const pattern of this.signaturePatterns) {
      const match = messageText.match(pattern.pattern);
      if (match) {
        signature = pattern.extractor(match);
        signatureBlock = match[0];
        // Remove signature block from content
        extractedContent = messageText.replace(match[0], '').trim();
        break;
      }
    }

    return {
      originalMessage: messageText,
      extractedContent,
      signature,
      sender,
      timestamp,
      metadata: {
        phoneNumber: sender,
        signatureBlock: signatureBlock || undefined,
        androidVersion:
          Platform.OS === 'android' ? String(Platform.Version) : undefined,
      },
    };
  }

  /**
   * Set up SMS monitoring with Android version compatibility
   */
  async setupSMSMonitoring(callback: (sms: ParsedSMS) => void): Promise<{
    success: boolean;
    method: 'auto' | 'manual' | 'demo';
    message: string;
  }> {
    if (Platform.OS === 'web') {
      console.warn('SMS monitoring not available on web platform');
      this.simulateSMSForDemo(callback);
      return {
        success: true,
        method: 'demo',
        message: 'Demo mode active - simulated SMS messages',
      };
    }

    try {
      // For demo purposes, always use demo mode
      this.simulateSMSForDemo(callback);

      return {
        success: true,
        method: 'demo',
        message: 'Demo mode active - simulated SMS messages',
      };
    } catch (error) {
      console.error('SMS monitoring setup error:', error);
      return {
        success: false,
        method: 'manual',
        message: 'Failed to setup SMS monitoring',
      };
    }
  }

  /**
   * Get SMS messages with Android version compatibility
   */
  async getSMSMessages(maxCount = 50): Promise<{
    messages: any[];
    success: boolean;
    method: 'native' | 'demo';
    message: string;
  }> {
    // For demo purposes, always use demo mode
    return {
      messages: this.getDemoSMSMessages(),
      success: true,
      method: 'demo',
      message: 'Demo SMS messages loaded',
    };
  }

  /**
   * Validate if a message contains a proper signature format
   */
  containsValidSignature(messageText: string): boolean {
    return this.signaturePatterns.some((pattern) =>
      pattern.pattern.test(messageText)
    );
  }

  /**
   * Extract sender information from various SMS formats
   */
  extractSenderInfo(sender: string): {
    phoneNumber?: string;
    displayName?: string;
    isShortCode?: boolean;
  } {
    const phoneRegex = /^\+?[\d\s\-$$$$]+$/;
    const shortCodeRegex = /^\d{3,6}$/;

    if (shortCodeRegex.test(sender)) {
      return {
        phoneNumber: sender,
        isShortCode: true,
      };
    }

    if (phoneRegex.test(sender)) {
      return {
        phoneNumber: sender.replace(/[\s\-$$$$]/g, ''),
        isShortCode: false,
      };
    }

    return {
      displayName: sender,
      isShortCode: false,
    };
  }

  /**
   * Get demo SMS messages for testing and Android 13+ fallback
   */
  private getDemoSMSMessages(): any[] {
    const currentTime = Date.now();
    const companies = [
      { name: 'CryptoSecure Technologies', phone: '+1-555-0123' },
      { name: 'FinanceFlow Digital', phone: '+1-555-0456' },
      { name: 'MedChain Innovations', phone: '+1-555-0789' },
      { name: 'BlockTrust Solutions', phone: '+1-555-0321' },
      { name: 'SecureVault Systems', phone: '+1-555-0654' },
    ];

    const messageTemplates = [
      (company: any) =>
        `Your ${company.name} account balance: $${(
          Math.random() * 50000 +
          1000
        ).toFixed(
          2
        )}. Ref: ${this.generateTransactionId()} [SIG:${this.generateHexSignature()}]`,
      (company: any) =>
        `${
          company.name
        } verification code: ${this.generateVerificationCode()} [WEB3SIG:0x${this.generateWeb3Signature()}]`,
      (company: any) =>
        `${
          company.name
        }: Meeting scheduled for ${this.generateDate()} at ${this.generateTime()} [SIGNATURE:${this.generateBase64Signature()}]`,
      (company: any) =>
        `${
          company.name
        } shipping: Order #${this.generateOrderId()} shipped. Track: ${this.generateTrackingId()} [ETH:0x${this.generateEthSignature()}]`,
      (company: any) =>
        `${
          company.name
        } security alert: Login from ${this.generateLocation()} at ${new Date().toLocaleTimeString()}`,
      (company: any) =>
        `${
          company.name
        }: Payment $${this.generateAmount()} from ${this.generateName()} [SIG:${this.generateHexSignature()}]`,
    ];

    return Array.from({ length: 6 }, (_, index) => {
      const company = companies[index % companies.length];
      const template = messageTemplates[index % messageTemplates.length];

      return {
        _id: `sms-${currentTime}-${index}`,
        address: company.phone,
        body: template(company),
        date: currentTime - index * 3600000 - Math.random() * 3600000,
        type: 1,
        read: Math.random() > 0.3 ? 1 : 0,
      };
    });
  }

  /**
   * Generate a sample SMS with signature for testing
   */
  generateTestSMS(
    message: string,
    signatureType: 'hex' | 'base64' | 'web3' | 'ethereum' = 'hex'
  ): string {
    const signatures = {
      hex: `[SIG:${this.generateHexSignature()}]`,
      base64: `[SIGNATURE:${this.generateBase64Signature()}]`,
      web3: `[WEB3SIG:0x${this.generateWeb3Signature()}]`,
      ethereum: `[ETH:0x${this.generateEthSignature()}]`,
    };

    return `${message} ${signatures[signatureType]}`;
  }

  /**
   * Clean message content by removing signature blocks and metadata
   */
  cleanMessageContent(messageText: string): string {
    let cleaned = messageText;

    // Remove all signature patterns
    for (const pattern of this.signaturePatterns) {
      cleaned = cleaned.replace(pattern.pattern, '');
    }

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  // Private helper methods for generating realistic test data

  private generateHexSignature(): string {
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateWeb3Signature(): string {
    return Array.from({ length: 128 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateEthSignature(): string {
    return Array.from({ length: 130 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateBase64Signature(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    return (
      Array.from(
        { length: 88 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('') + '=='
    );
  }

  private generateTransactionId(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateOrderId(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  private generateTrackingId(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    return (
      Array.from(
        { length: 3 },
        () => letters[Math.floor(Math.random() * letters.length)]
      ).join('') +
      Array.from(
        { length: 6 },
        () => numbers[Math.floor(Math.random() * numbers.length)]
      ).join('')
    );
  }

  private generateTime(): string {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.random() > 0.5 ? '00' : '30';
    const ampm = Math.random() > 0.5 ? 'AM' : 'PM';
    return `${hour}:${minute} ${ampm}`;
  }

  private generateDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString();
  }

  private generateLocation(): string {
    const cities = [
      'New York',
      'London',
      'Tokyo',
      'Sydney',
      'Paris',
      'Berlin',
      'Toronto',
      'Singapore',
    ];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  private generateAmount(): string {
    return (Math.random() * 1000 + 10).toFixed(2);
  }

  private generateName(): string {
    const firstNames = [
      'John',
      'Jane',
      'Mike',
      'Sarah',
      'David',
      'Lisa',
      'Chris',
      'Emma',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
      lastNames[Math.floor(Math.random() * lastNames.length)]
    }`;
  }

  // Private methods

  private simulateSMSForDemo(callback: (sms: ParsedSMS) => void) {
    const companies = [
      { name: 'CryptoSecure Technologies', phone: '+1-555-0123' },
      { name: 'FinanceFlow Digital', phone: '+1-555-0456' },
      { name: 'MedChain Innovations', phone: '+1-555-0789' },
    ];

    const testMessages = [
      {
        text: `Your ${companies[0].name} account balance: $${(
          Math.random() * 50000 +
          1000
        ).toFixed(
          2
        )}. Ref: ${this.generateTransactionId()} [SIG:${this.generateHexSignature()}]`,
        sender: companies[0].phone,
        delay: 2000,
      },
      {
        text: `${
          companies[1].name
        } verification code: ${this.generateVerificationCode()} [WEB3SIG:0x${this.generateWeb3Signature()}]`,
        sender: companies[1].phone,
        delay: 5000,
      },
      {
        text: `${
          companies[2].name
        }: Meeting scheduled for ${this.generateDate()} at ${this.generateTime()} [SIGNATURE:${this.generateBase64Signature()}]`,
        sender: companies[2].phone,
        delay: 8000,
      },
    ];

    testMessages.forEach((msg, index) => {
      setTimeout(() => {
        const parsed = this.parseSMSMessage(msg.text, msg.sender);
        callback(parsed);
      }, msg.delay);
    });
  }
}

export const smsService = new SMSService();
export default SMSService;
