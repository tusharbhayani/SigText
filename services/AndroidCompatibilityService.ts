// Android Compatibility Service
// Handles version-specific implementations for Android 12, 13, 14+

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import * as Device from 'expo-device';
import * as IntentLauncher from 'expo-intent-launcher';

interface AndroidVersionInfo {
  apiLevel: number;
  version: string;
  isAndroid13Plus: boolean;
  isAndroid14Plus: boolean;
  requiresSpecialSMSHandling: boolean;
}

class AndroidCompatibilityService {
  private versionInfo: AndroidVersionInfo;

  constructor() {
    this.versionInfo = this.getAndroidVersionInfo();
  }

  /**
   * Get detailed Android version information
   */
  private getAndroidVersionInfo(): AndroidVersionInfo {
    const apiLevel = Platform.OS === 'android' ? (Platform.Version as number) : 0;
    
    return {
      apiLevel,
      version: this.getAndroidVersionName(apiLevel),
      isAndroid13Plus: apiLevel >= 33,
      isAndroid14Plus: apiLevel >= 34,
      requiresSpecialSMSHandling: apiLevel >= 33,
    };
  }

  /**
   * Convert API level to Android version name
   */
  private getAndroidVersionName(apiLevel: number): string {
    const versionMap: { [key: number]: string } = {
      21: 'Android 5.0 (Lollipop)',
      22: 'Android 5.1 (Lollipop)',
      23: 'Android 6.0 (Marshmallow)',
      24: 'Android 7.0 (Nougat)',
      25: 'Android 7.1 (Nougat)',
      26: 'Android 8.0 (Oreo)',
      27: 'Android 8.1 (Oreo)',
      28: 'Android 9 (Pie)',
      29: 'Android 10',
      30: 'Android 11',
      31: 'Android 12',
      32: 'Android 12L',
      33: 'Android 13',
      34: 'Android 14',
      35: 'Android 15',
    };

    return versionMap[apiLevel] || `Android API ${apiLevel}`;
  }

  /**
   * Request SMS permissions with version-specific handling
   */
  async requestSMSPermissions(): Promise<{
    granted: boolean;
    requiresManualSetup: boolean;
    message: string;
  }> {
    if (Platform.OS !== 'android') {
      return {
        granted: false,
        requiresManualSetup: false,
        message: 'SMS permissions not available on this platform'
      };
    }

    try {
      if (this.versionInfo.isAndroid13Plus) {
        return await this.handleAndroid13PlusSMS();
      } else {
        return await this.handleLegacyAndroidSMS();
      }
    } catch (error) {
      console.error('SMS permission error:', error);
      return {
        granted: false,
        requiresManualSetup: false,
        message: 'Error requesting SMS permissions'
      };
    }
  }

  /**
   * Handle SMS permissions for Android 13+
   */
  private async handleAndroid13PlusSMS(): Promise<{
    granted: boolean;
    requiresManualSetup: boolean;
    message: string;
  }> {
    // Check if app is already default SMS app
    const isDefaultSMSApp = await this.checkIfDefaultSMSApp();
    
    if (isDefaultSMSApp) {
      return {
        granted: true,
        requiresManualSetup: false,
        message: 'SMS access granted (Default SMS app)'
      };
    }

    // Try standard permission request first
    try {
      const readSmsResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Reading Permission',
          message: 'This app needs to read SMS messages to verify cryptographic signatures for security purposes.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );

      if (readSmsResult === PermissionsAndroid.RESULTS.GRANTED) {
        return {
          granted: true,
          requiresManualSetup: false,
          message: 'SMS reading permission granted'
        };
      }

      // If standard permission fails, offer alternative solutions
      return {
        granted: false,
        requiresManualSetup: true,
        message: 'SMS permission denied. Manual setup required for Android 13+'
      };

    } catch (error) {
      console.error('Android 13+ SMS permission error:', error);
      return {
        granted: false,
        requiresManualSetup: true,
        message: 'SMS permission request failed. Please enable manually in settings.'
      };
    }
  }

  /**
   * Handle SMS permissions for Android 12 and below
   */
  private async handleLegacyAndroidSMS(): Promise<{
    granted: boolean;
    requiresManualSetup: boolean;
    message: string;
  }> {
    try {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ]);

      const readGranted = permissions[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;
      const receiveGranted = permissions[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;

      if (readGranted && receiveGranted) {
        return {
          granted: true,
          requiresManualSetup: false,
          message: 'SMS permissions granted'
        };
      }

      return {
        granted: false,
        requiresManualSetup: false,
        message: 'SMS permissions denied'
      };

    } catch (error) {
      console.error('Legacy Android SMS permission error:', error);
      return {
        granted: false,
        requiresManualSetup: false,
        message: 'Error requesting SMS permissions'
      };
    }
  }

  /**
   * Check if app is set as default SMS app (Android 13+ workaround)
   */
  private async checkIfDefaultSMSApp(): Promise<boolean> {
    try {
      // This would require native code to properly implement
      // For now, we'll return false and handle via alternative methods
      return false;
    } catch (error) {
      console.error('Error checking default SMS app status:', error);
      return false;
    }
  }

  /**
   * Open app settings for manual permission configuration
   */
  async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening app settings:', error);
      Alert.alert(
        'Settings Error',
        'Unable to open app settings. Please manually navigate to Settings > Apps > Web3 Message Verifier > Permissions'
      );
    }
  }

  /**
   * Show Android 13+ specific guidance
   */
  showAndroid13Guidance(): void {
    Alert.alert(
      'Android 13+ SMS Access',
      `Your device is running ${this.versionInfo.version}. Due to enhanced security in Android 13+, SMS access requires special configuration.\n\nOptions:\n1. Grant permission when prompted\n2. Use QR code scanning instead\n3. Manually enable SMS permissions in Settings`,
      [
        { text: 'Use QR Scanner', style: 'default' },
        { text: 'Open Settings', onPress: () => this.openAppSettings() },
        { text: 'OK', style: 'cancel' }
      ]
    );
  }

  /**
   * Get compatibility status and recommendations
   */
  getCompatibilityStatus(): {
    isSupported: boolean;
    version: string;
    recommendations: string[];
    limitations: string[];
  } {
    const recommendations: string[] = [];
    const limitations: string[] = [];

    if (this.versionInfo.isAndroid13Plus) {
      recommendations.push('Use QR code scanning for best compatibility');
      recommendations.push('Enable SMS permissions manually in Settings if needed');
      limitations.push('SMS auto-detection may require additional setup');
    }

    if (this.versionInfo.isAndroid14Plus) {
      recommendations.push('Ensure app is updated to latest version');
      limitations.push('Some SMS features may be restricted');
    }

    return {
      isSupported: this.versionInfo.apiLevel >= 21,
      version: this.versionInfo.version,
      recommendations,
      limitations
    };
  }

  /**
   * Initialize app with version-specific configurations
   */
  async initializeForAndroidVersion(): Promise<{
    success: boolean;
    message: string;
    features: {
      smsAutoDetection: boolean;
      qrScanning: boolean;
      voiceFeedback: boolean;
      notifications: boolean;
    };
  }> {
    try {
      const features = {
        smsAutoDetection: !this.versionInfo.requiresSpecialSMSHandling,
        qrScanning: true,
        voiceFeedback: true,
        notifications: true,
      };

      // Request notification permission for Android 13+
      if (this.versionInfo.isAndroid13Plus) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'Enable notifications to receive verification alerts.',
              buttonPositive: 'Allow',
              buttonNegative: 'Skip',
            }
          );
        } catch (error) {
          console.warn('Notification permission request failed:', error);
          features.notifications = false;
        }
      }

      return {
        success: true,
        message: `Initialized for ${this.versionInfo.version}`,
        features
      };

    } catch (error) {
      console.error('Android initialization error:', error);
      return {
        success: false,
        message: 'Failed to initialize for Android version',
        features: {
          smsAutoDetection: false,
          qrScanning: true,
          voiceFeedback: false,
          notifications: false,
        }
      };
    }
  }

  /**
   * Get version info for debugging
   */
  getVersionInfo(): AndroidVersionInfo {
    return this.versionInfo;
  }
}

export const androidCompatibilityService = new AndroidCompatibilityService();
export default AndroidCompatibilityService;