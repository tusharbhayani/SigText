import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Flashlight, RotateCcw, X, Shield } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useVerification } from '../contexts/VerificationContext';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

export default function ScannerScreen() {
  const { colors, isDark } = useTheme();
  const { verifyQRMessage, enableVoiceFeedback } = useVerification();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigation = useNavigation();

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    setVerifying(true);

    // Trigger haptic feedback (web-safe)
    if (Platform.OS !== 'web') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        impactAsync(ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    try {
      // Verify QR message using Supabase service
      const isVerified = await verifyQRMessage(data);

      let organizationName = '';
      let message = '';

      if (isVerified) {
        // Try to extract organization info from QR data
        try {
          const qrData = JSON.parse(data);
          organizationName = qrData.organizationName || qrData.issuer || 'Verified Organization';
          message = `Message verified successfully from ${organizationName}!`;
        } catch {
          message = 'Message verified successfully!';
        }
      } else {
        message = 'Verification failed - signature invalid or organization not verified';
      }

      // Navigate to the result screen
      navigation.navigate(
        'ScanResult' as never,
        {
          result: {
            data,
            type,
            verified: isVerified,
            organizationName,
            message,
            details: {
              scanTime: new Date().toISOString(),
              scanType: type,
              verificationMethod: 'blockchain',
            },
          },
        } as never
      );

      // Voice feedback
      if (enableVoiceFeedback && Platform.OS !== 'web') {
        speakResult(isVerified, organizationName);
      }
    } catch (error) {
      console.error('QR verification error:', error);
      navigation.navigate(
        'ScanResult' as never,
        {
          result: {
            data,
            type,
            verified: false,
            message: 'Invalid QR code format or verification service error',
          },
        } as never
      );
    } finally {
      setVerifying(false);
      // Reset scanner after navigation
      setTimeout(() => {
        setScanned(false);
      }, 1000);
    }
  };

  const speakResult = async (verified: boolean, organizationName?: string) => {
    if (!enableVoiceFeedback) return;

    try {
      const message = verified
        ? `Message verified successfully${organizationName ? ` from ${organizationName}` : ''}`
        : 'Verification failed. The signature could not be validated.';

      // In a real app, use voice service
      console.log('Voice feedback:', message);
    } catch (error) {
      console.error('Voice feedback error:', error);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    setTorch(current => !current);
  };

  const resetScanner = () => {
    setScanned(false);
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.text, { color: colors.text }]}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Camera size={64} color={colors.primary} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Camera access is required to scan QR codes
          </Text>
          <Text style={[styles.permissionSubtext, { color: colors.textSecondary }]}>
            We need camera permission to verify message signatures from trusted organizations
          </Text>
          <Pressable
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          enableTorch={torch}
        />

        {/* Scanning overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />

            {!scanned && !verifying && (
              <Animatable.View animation="pulse" iterationCount="infinite" style={styles.scanLine}>
                <View style={[styles.scanLineInner, { backgroundColor: colors.primary }]} />
              </Animatable.View>
            )}

            {verifying && (
              <Animatable.View animation="rotate" iterationCount="infinite" style={styles.loadingSpinner}>
                <Shield size={32} color={colors.primary} />
              </Animatable.View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={[styles.instructions, { color: colors.text }]}>
              {scanned
                ? verifying
                  ? 'Verifying with trusted organizations...'
                  : 'Verification complete'
                : 'Position QR code within the frame to verify signature'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              style={[styles.controlButton, { backgroundColor: colors.surface + 'CC' }]}
              onPress={toggleTorch}
            >
              <Flashlight size={24} color={torch ? colors.primary : colors.text} />
            </Pressable>

            <Pressable
              style={[styles.controlButton, { backgroundColor: colors.surface + 'CC' }]}
              onPress={toggleCameraFacing}
            >
              <RotateCcw size={24} color={colors.text} />
            </Pressable>

            {scanned && (
              <Pressable
                style={[styles.controlButton, { backgroundColor: colors.surface + 'CC' }]}
                onPress={resetScanner}
              >
                <X size={24} color={colors.text} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  permissionText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    width: '100%',
    height: 2,
    justifyContent: 'center',
  },
  scanLineInner: {
    height: '100%',
    opacity: 0.8,
  },
  loadingSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
  },
  instructions: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});