import {
  supabase,
  verifyMessage,
  saveVerifiedMessage,
  getOrganizationByWallet,
  recordVerificationAttempt,
  type VerifiedMessage,
  type MessageVerificationAttempt,
} from '../lib/supabase';

interface VerificationResult {
  isValid: boolean;
  organizationId?: string;
  organizationName?: string;
  verificationDetails?: any;
  message?: string;
  success?: boolean;
  error?: string;
}

interface ParsedMessage {
  content: string;
  signature: string;
  senderAddress: string;
  metadata?: any;
}

class SupabaseVerificationService {
  /**
   * Verify a message signature against Supabase organization database
   */
  async verifyMessageSignature(
    messageContent: string,
    signature: string,
    senderAddress: string,
    verificationMethod: 'sms' | 'qr' | 'manual' = 'manual'
  ): Promise<VerificationResult> {
    try {
      // Clean and normalize inputs
      const cleanContent = messageContent.trim();
      const cleanSignature = signature.replace(/^0x/, '').toLowerCase();
      const cleanSender = senderAddress.toLowerCase();

      // Verify against Supabase
      const { data: verificationResult, error } = await verifyMessage(
        cleanContent,
        cleanSignature,
        cleanSender
      );

      if (error) {
        console.error('Supabase verification error:', error);
        return {
          isValid: false,
          success: false,
          error: 'Verification service error',
        };
      }

      if (!verificationResult) {
        return {
          isValid: false,
          success: false,
          error: 'No verification result returned',
        };
      }

      // Save verified message to database
      if (verificationResult.is_valid) {
        await this.saveVerificationResult({
          messageContent: cleanContent,
          signature: cleanSignature,
          senderAddress: cleanSender,
          organizationId: verificationResult.organization_id,
          verificationDetails: verificationResult.verification_details,
          verificationMethod,
        });
      }

      return {
        isValid: verificationResult.is_valid,
        success: true,
        organizationId: verificationResult.organization_id,
        organizationName: verificationResult.organization_name,
        verificationDetails: verificationResult.verification_details,
        message: verificationResult.is_valid
          ? `Message verified from ${verificationResult.organization_name}`
          : 'Message verification failed',
      };
    } catch (error) {
      console.error('Message verification error:', error);
      return {
        isValid: false,
        success: false,
        error: 'Verification failed due to technical error',
      };
    }
  }

  /**
   * Parse and verify SMS message with signature
   */
  async verifySMSMessage(
    smsContent: string,
    senderPhone?: string
  ): Promise<VerificationResult> {
    try {
      const parsed = this.parseSMSMessage(smsContent);

      if (!parsed.signature) {
        return {
          isValid: false,
          success: false,
          error: 'No signature found in SMS message',
        };
      }

      // Extract sender address from signature or use phone mapping
      const senderAddress = await this.resolveSenderAddress(
        parsed.senderAddress,
        senderPhone
      );

      if (!senderAddress) {
        return {
          isValid: false,
          success: false,
          error: 'Could not resolve sender wallet address',
        };
      }

      return await this.verifyMessageSignature(
        parsed.content,
        parsed.signature,
        senderAddress,
        'sms'
      );
    } catch (error) {
      console.error('SMS verification error:', error);
      return {
        isValid: false,
        success: false,
        error: 'SMS verification failed',
      };
    }
  }

  /**
   * Verify QR code message
   */
  async verifyQRMessage(qrData: string): Promise<VerificationResult> {
    try {
      const parsed = JSON.parse(qrData);
      const { message, signature, sender } = parsed;

      if (!message || !signature || !sender) {
        return {
          isValid: false,
          success: false,
          error: 'Invalid QR code format',
        };
      }

      return await this.verifyMessageSignature(
        message,
        signature,
        sender,
        'qr'
      );
    } catch (error) {
      console.error('QR verification error:', error);
      return {
        isValid: false,
        success: false,
        error: 'Invalid QR code format',
      };
    }
  }

  /**
   * Generic verify message method for compatibility
   */
  async verifyMessage(
    content: string,
    sender: string
  ): Promise<VerificationResult> {
    try {
      // Try to extract signature from content
      const parsed = this.parseSMSMessage(content);

      if (!parsed.signature) {
        return {
          isValid: false,
          success: false,
          error: 'No signature found in message',
        };
      }

      return await this.verifyMessageSignature(
        parsed.content,
        parsed.signature,
        sender || parsed.senderAddress,
        'manual'
      );
    } catch (error) {
      console.error('Message verification error:', error);
      return {
        isValid: false,
        success: false,
        error: 'Message verification failed',
      };
    }
  }

  /**
   * Get organization information by wallet address
   */
  async getOrganizationInfo(walletAddress: string) {
    try {
      const { data, error } = await getOrganizationByWallet(walletAddress);

      if (error) {
        console.error('Organization lookup error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Organization info error:', error);
      return null;
    }
  }

  /**
   * Check if a sender is a verified organization
   */
  async isVerifiedSender(walletAddress: string): Promise<boolean> {
    const org = await this.getOrganizationInfo(walletAddress);
    return org?.verification_status === 'verified';
  }

  /**
   * Get verification history for current user
   */
  async getVerificationHistory() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('message_verification_attempts')
        .select(
          `
          *,
          verified_messages(
            *,
            organization:organizations(name, logo_url, verification_status)
          )
        `
        )
        .eq('attempted_by', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      return { data, error };
    } catch (error) {
      console.error('Verification history error:', error);
      return { data: [], error };
    }
  }

  // Private helper methods

  private parseSMSMessage(smsContent: string): ParsedMessage {
    // Enhanced SMS parsing with multiple signature formats
    const signaturePatterns = [
      /\[SIG:([0-9a-fA-F]{64,})\]/i,
      /\[SIGNATURE:([A-Za-z0-9+/=]{64,})\]/i,
      /\[WEB3SIG:0x([0-9a-fA-F]{128,})\]/i,
      /\[ETH:0x([0-9a-fA-F]{130})\]/i,
      /\[DID:(did:[a-z0-9]+:[a-zA-Z0-9._-]+)#SIG:([0-9a-fA-F]{64,})\]/i,
    ];

    let signature = '';
    let content = smsContent;
    let senderAddress = '';

    // Try each pattern
    for (const pattern of signaturePatterns) {
      const match = smsContent.match(pattern);
      if (match) {
        if (pattern.source.includes('DID:')) {
          // DID pattern - extract both DID and signature
          senderAddress = match[1]; // DID
          signature = match[2]; // Signature
        } else if (
          pattern.source.includes('WEB3SIG:') ||
          pattern.source.includes('ETH:')
        ) {
          // Web3/ETH patterns - add 0x prefix
          signature = '0x' + match[1];
        } else {
          signature = match[1];
        }

        // Remove signature block from content
        content = smsContent.replace(match[0], '').trim();
        break;
      }
    }

    return {
      content,
      signature,
      senderAddress,
      metadata: {
        originalMessage: smsContent,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  private async resolveSenderAddress(
    extractedAddress: string,
    senderPhone?: string
  ): Promise<string | null> {
    // If we have a DID or wallet address from the message, use it
    if (
      extractedAddress &&
      (extractedAddress.startsWith('did:') || extractedAddress.startsWith('0x'))
    ) {
      return extractedAddress;
    }

    // Try to resolve phone number to wallet address
    if (senderPhone) {
      // In a real implementation, you might have a phone-to-wallet mapping
      // For now, we'll check if there's an organization with this phone in metadata
      const { data, error } = await supabase
        .from('organizations')
        .select('wallet_address')
        .contains('metadata', { phone: senderPhone })
        .eq('verification_status', 'verified')
        .limit(1);

      if (data && data.length > 0) {
        return data[0].wallet_address;
      }
    }

    // For demo purposes, return a mock address if we can't resolve
    return '0x1111111111111111111111111111111111111111';
  }

  private async saveVerificationResult(params: {
    messageContent: string;
    signature: string;
    senderAddress: string;
    organizationId?: string;
    verificationDetails?: any;
    verificationMethod: string;
  }) {
    try {
      // Save verified message
      const messageData: Partial<VerifiedMessage> = {
        organization_id: params.organizationId,
        message_content: params.messageContent,
        signature: params.signature,
        sender_address: params.senderAddress,
        verification_status: 'verified',
        verification_details: params.verificationDetails,
        verified_at: new Date().toISOString(),
      };

      const { data: savedMessage, error: messageError } =
        await saveVerifiedMessage(messageData);

      if (messageError) {
        console.error('Error saving verified message:', messageError);
        return;
      }

      // Record verification attempt
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && savedMessage) {
        const attemptData: Partial<MessageVerificationAttempt> = {
          message_id: savedMessage.id,
          attempted_by: user.id,
          verification_method: params.verificationMethod,
          success: true,
          verification_data: {
            timestamp: new Date().toISOString(),
            organization_id: params.organizationId,
          },
        };

        await recordVerificationAttempt(attemptData);
      }
    } catch (error) {
      console.error('Error saving verification result:', error);
    }
  }
}

export const supabaseVerificationService = new SupabaseVerificationService();
export default SupabaseVerificationService;
