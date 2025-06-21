// Mobile-First Voice Service for Expo
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

interface VoiceConfig {
  apiKey?: string;
  voiceId?: string;
  modelId?: string;
}

class VoiceService {
  private config: VoiceConfig;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private isMobile: boolean;
  private isAvailableCache: boolean | null = null;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.isMobile = Platform.OS !== 'web';
    this.checkAvailability();
  }

  private async checkAvailability() {
    if (this.isMobile) {
      // For mobile, check if Expo Speech is available
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        this.isAvailableCache = voices.length > 0;
      } catch (error) {
        console.log('Speech not available:', error);
        this.isAvailableCache = false;
      }
    } else {
      // For web, check Web Speech API
      this.isAvailableCache = 'speechSynthesis' in window;
    }
  }

  /**
   * Synthesize speech using platform-appropriate method
   */
  async synthesizeSpeech(text: string): Promise<boolean> {
    try {
      // Try ElevenLabs API first if API key is available
      if (this.config.apiKey && Platform.OS === 'web') {
        const success = await this.elevenLabsSynthesis(text);
        if (success) return true;
      }

      // Fallback to platform-specific TTS
      if (this.isMobile) {
        return await this.mobileSpeechSynthesis(text);
      } else {
        return await this.webSpeechSynthesis(text);
      }
    } catch (error) {
      console.error('Voice synthesis error:', error);
      return false;
    }
  }

  /**
   * ElevenLabs API synthesis (web only)
   */
  private async elevenLabsSynthesis(text: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.config.voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey!,
          },
          body: JSON.stringify({
            text,
            model_id: this.config.modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return await this.playAudioBlob(audioBlob);
    } catch (error) {
      console.warn('ElevenLabs synthesis failed:', error);
      return false;
    }
  }

  /**
   * Mobile speech synthesis using Expo Speech
   */
  private async mobileSpeechSynthesis(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const options: Speech.SpeechOptions = {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
          volume: 0.8,
          onStart: () => {
            console.log('Speech started');
          },
          onDone: () => {
            console.log('Speech completed');
            resolve(true);
          },
          onStopped: () => {
            console.log('Speech stopped');
            resolve(true);
          },
          onError: (error) => {
            console.error('Speech error:', error);
            resolve(false);
          },
        };

        Speech.speak(text, options);

        // Fallback timeout
        setTimeout(() => {
          resolve(true);
        }, Math.max(text.length * 100, 3000));
      } catch (error) {
        console.error('Mobile speech synthesis error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Web speech synthesis fallback
   */
  private async webSpeechSynthesis(text: string): Promise<boolean> {
    if (Platform.OS !== 'web' || !('speechSynthesis' in window)) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find((voice) =>
          voice.lang.startsWith('en')
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);

        speechSynthesis.speak(utterance);

        setTimeout(() => resolve(true), Math.max(text.length * 100, 3000));
      } catch (error) {
        console.error('Web speech synthesis error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Play audio blob (web only)
   */
  private async playAudioBlob(blob: Blob): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(true);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };

        audio.play().catch(() => resolve(false));
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Play verification result
   */
  async playVerificationResult(
    verified: boolean,
    message?: string
  ): Promise<boolean> {
    const text =
      message ||
      (verified
        ? 'Message verification successful. The signature is valid and trusted.'
        : 'Message verification failed. The signature could not be validated.');

    return await this.synthesizeSpeech(text);
  }

  /**
   * Simple speak method
   */
  async speak(text: string): Promise<boolean> {
    return await this.synthesizeSpeech(text);
  }

  /**
   * Test voice functionality
   */
  async testVoice(): Promise<boolean> {
    try {
      console.log('Testing voice functionality...');
      console.log('Platform:', Platform.OS);
      console.log('Is available:', this.isAvailable());

      if (!this.isAvailable()) {
        console.log('Voice service not available');
        return false;
      }

      const testText =
        'Voice service test successful. Audio is working correctly.';
      const result = await this.speak(testText);

      console.log('Voice test result:', result);
      return result;
    } catch (error) {
      console.error('Voice test failed:', error);
      return false;
    }
  }

  /**
   * Check if voice service is available
   */
  isAvailable(): boolean {
    if (this.isAvailableCache !== null) {
      return this.isAvailableCache;
    }

    if (this.config.apiKey && Platform.OS === 'web') {
      return true;
    }

    if (this.isMobile) {
      return true; // Expo Speech is generally available on mobile
    }

    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      return true;
    }

    return false;
  }

  /**
   * Get voice service status
   */
  getStatus(): {
    available: boolean;
    provider: 'ElevenLabs' | 'expo-speech' | 'web-speech' | 'none';
    hasApiKey: boolean;
    platform: string;
  } {
    const hasApiKey = !!this.config.apiKey;

    if (hasApiKey) {
      return {
        available: true,
        provider: 'ElevenLabs',
        hasApiKey: true,
        platform: Platform.OS,
      };
    }

    if (this.isMobile) {
      return {
        available: this.isAvailable(),
        provider: 'expo-speech',
        hasApiKey: false,
        platform: Platform.OS,
      };
    }

    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      return {
        available: true,
        provider: 'web-speech',
        hasApiKey: false,
        platform: Platform.OS,
      };
    }

    return {
      available: false,
      provider: 'none',
      hasApiKey: false,
      platform: Platform.OS,
    };
  }

  /**
   * Stop any ongoing speech
   */
  stop(): void {
    try {
      if (this.isMobile) {
        Speech.stop();
      } else if (Platform.OS === 'web' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Get available voices (platform-specific)
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      if (this.isMobile) {
        return await Speech.getAvailableVoicesAsync();
      } else if (Platform.OS === 'web' && 'speechSynthesis' in window) {
        return speechSynthesis.getVoices();
      }
      return [];
    } catch (error) {
      console.error('Error getting voices:', error);
      return [];
    }
  }
}

// Export configured instance
export const voiceService = new VoiceService({
  apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
  voiceId:
    process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  modelId: 'eleven_monolingual_v1',
});

export default VoiceService;
