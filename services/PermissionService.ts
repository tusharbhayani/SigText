// Permission Management Service
// Handles all permission requests with Android version compatibility

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';

interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class PermissionService {
  private androidVersion: number = 0;

  constructor() {
    if (Platform.OS === 'android') {
      this.androidVersion = Platform.Version as number;
    }
  }

  /**
   * Request SMS permissions with Android version compatibility
   */
  async requestSMSPermissions(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return { granted: false, canAskAgain: false, status: 'unavailable' };
    }

    try {
      // For Android 13+ (API 33+), we need to handle SMS permissions differently
      if (this.androidVersion >= 33) {
        // Android 13+ has more restrictive SMS access
        // Apps need to be default SMS app or have special permissions
        const readSmsGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission Required',
            message:
              'This app needs access to read SMS messages to verify signatures. This is required for security verification.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const receiveSmsGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: 'SMS Receive Permission',
            message:
              'Allow the app to receive SMS messages for automatic verification.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const granted =
          readSmsGranted === PermissionsAndroid.RESULTS.GRANTED &&
          receiveSmsGranted === PermissionsAndroid.RESULTS.GRANTED;

        return {
          granted,
          canAskAgain:
            readSmsGranted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
          status: granted ? 'granted' : 'denied',
        };
      } else {
        // Android 12 and below - standard permission request
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        ]);

        const allGranted = Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        return {
          granted: allGranted,
          canAskAgain: true,
          status: allGranted ? 'granted' : 'denied',
        };
      }
    } catch (error) {
      console.error('SMS permission error:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Request camera permissions with enhanced compatibility
   */
  async requestCameraPermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      const { status, canAskAgain } =
        await Camera.requestCameraPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('Camera permission error:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Request notification permissions (required for Android 13+)
   */
  async requestNotificationPermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      // For Android 13+, notification permission is required
      if (Platform.OS === 'android' && this.androidVersion >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message:
              'Allow notifications to receive verification alerts and security warnings.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          canAskAgain: granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
          status:
            granted === PermissionsAndroid.RESULTS.GRANTED
              ? 'granted'
              : 'denied',
        };
      }

      // For iOS and older Android versions
      const { status, canAskAgain } =
        await Notifications.requestPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('Notification permission error:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Check if all required permissions are granted
   */
  async checkAllPermissions(): Promise<{
    sms: PermissionStatus;
    camera: PermissionStatus;
    notifications: PermissionStatus;
    allGranted: boolean;
  }> {
    const sms = await this.checkSMSPermissions();
    const camera = await this.checkCameraPermissions();
    const notifications = await this.checkNotificationPermissions();

    return {
      sms,
      camera,
      notifications,
      allGranted: sms.granted && camera.granted && notifications.granted,
    };
  }

  /**
   * Check SMS permissions status
   */
  async checkSMSPermissions(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return { granted: false, canAskAgain: false, status: 'unavailable' };
    }

    try {
      const readSms = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      const receiveSms = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
      );

      return {
        granted: readSms && receiveSms,
        canAskAgain: true,
        status: readSms && receiveSms ? 'granted' : 'denied',
      };
    } catch (error) {
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Check camera permissions status
   */
  async checkCameraPermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Check notification permissions status
   */
  async checkNotificationPermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      const { status, canAskAgain } = await Notifications.getPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Show permission rationale for Android 13+
   */
  showPermissionRationale(
    permissionType: 'sms' | 'camera' | 'notifications'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const messages = {
        sms: {
          title: 'SMS Access Required',
          message:
            'This app needs SMS access to automatically verify message signatures. This helps protect you from fraudulent messages by checking cryptographic signatures.',
        },
        camera: {
          title: 'Camera Access Required',
          message:
            'Camera access is needed to scan QR codes containing signed messages for verification.',
        },
        notifications: {
          title: 'Notification Permission',
          message:
            'Notifications help alert you about verification results and security warnings.',
        },
      };

      const { title, message } = messages[permissionType];

      Alert.alert(title, message, [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Grant Permission',
          onPress: () => resolve(true),
        },
      ]);
    });
  }

  /**
   * Get device and Android version info
   */
  getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isDevice: Device.isDevice,
      androidApiLevel: Platform.OS === 'android' ? Platform.Version : null,
      isAndroid13Plus:
        Platform.OS === 'android' && (Platform.Version as number) >= 33,
    };
  }

  /**
   * Request all permissions in sequence with proper error handling
   */
  async requestAllPermissions(): Promise<boolean> {
    try {
      // Request permissions in order of importance
      const cameraResult = await this.requestCameraPermissions();
      if (!cameraResult.granted) {
        console.warn('Camera permission denied');
      }

      const notificationResult = await this.requestNotificationPermissions();
      if (!notificationResult.granted) {
        console.warn('Notification permission denied');
      }

      const smsResult = await this.requestSMSPermissions();
      if (!smsResult.granted) {
        console.warn('SMS permission denied');
      }

      // Return true if at least camera permission is granted (minimum requirement)
      return cameraResult.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
}

export const permissionService = new PermissionService();
export default PermissionService;
