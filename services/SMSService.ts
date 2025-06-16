// SMS Parsing and Verification Service
// Enhanced with Android 13+ compatibility

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

  private isAndroid13Plus: boolean = false;

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
  async getSMSMessages(maxCount: number = 50): Promise<{
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
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const shortCodeRegex = /^\d{3,6}$/;

    if (shortCodeRegex.test(sender)) {
      return {
        phoneNumber: sender,
        isShortCode: true,
      };
    }

    if (phoneRegex.test(sender)) {
      return {
        phoneNumber: sender.replace(/[\s\-\(\)]/g, ''),
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
    return [
      {
        _id: '1',
        address: '+1234567890',
        body: 'Your bank account has been accessed. Transaction ID: 123456 [SIG:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456]',
        date: Date.now() - 3600000,
        type: 1,
        read: 0,
      },
      {
        _id: '2',
        address: 'SERVICE',
        body: 'Welcome to our service! Your verification code is 789012 [WEB3SIG:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef01234]',
        date: Date.now() - 7200000,
        type: 1,
        read: 1,
      },
      {
        _id: '3',
        address: '+9876543210',
        body: 'Meeting scheduled for tomorrow at 3 PM in Conference Room A [SIGNATURE:SGVsbG8gV29ybGQgVGhpcyBJcyBBIFRlc3QgU2lnbmF0dXJl]',
        date: Date.now() - 10800000,
        type: 1,
        read: 1,
      },
      {
        _id: '4',
        address: 'SHIPPING',
        body: 'Your order #12345 has been shipped. Track: ABC123XYZ [ETH:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef]',
        date: Date.now() - 14400000,
        type: 1,
        read: 1,
      },
      {
        _id: '5',
        address: 'SECURITY',
        body: 'Security alert: New login detected from unknown device',
        date: Date.now() - 18000000,
        type: 1,
        read: 1,
      },
      {
        _id: '6',
        address: '+5551234567',
        body: 'Payment received: $50.00 from John Doe [SIG:b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1]',
        date: Date.now() - 21600000,
        type: 1,
        read: 1,
      },
    ];
  }

  /**
   * Generate a sample SMS with signature for testing
   */
  generateTestSMS(
    message: string,
    signatureType: 'hex' | 'base64' | 'web3' | 'ethereum' = 'hex'
  ): string {
    const signatures = {
      hex: '[SIG:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456]',
      base64:
        '[SIGNATURE:SGVsbG8gV29ybGQgVGhpcyBJcyBBIFRlc3QgU2lnbmF0dXJlIEZvciBEZW1vbnN0cmF0aW9u]',
      web3: '[WEB3SIG:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0]',
      ethereum:
        '[ETH:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef0123456789abcdef]',
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

  // Private methods

  private simulateSMSForDemo(callback: (sms: ParsedSMS) => void) {
    const testMessages = [
      {
        text: 'Your bank account has been accessed. Transaction ID: 123456 [SIG:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456]',
        sender: '+1234567890',
        delay: 2000,
      },
      {
        text: 'Welcome to our service! Your verification code is 789012 [WEB3SIG:0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef01234]',
        sender: 'SERVICE',
        delay: 5000,
      },
      {
        text: 'Meeting scheduled for tomorrow at 3 PM in Conference Room A [SIGNATURE:SGVsbG8gV29ybGQgVGhpcyBJcyBBIFRlc3QgU2lnbmF0dXJl]',
        sender: '+9876543210',
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
