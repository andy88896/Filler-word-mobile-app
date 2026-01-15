import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';
import AudioSessionConfig from 'audio-session-config';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  permissionStatus: PermissionStatus;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition(
  onTranscript: (text: string) => void
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('undetermined');
  const shouldBeListening = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref up to date
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Enable haptics AFTER speech recognition has started and configured the audio session
  // This is critical - expo-speech-recognition reconfigures the audio session when it starts,
  // so we must enable haptics AFTER that happens, not before
  useSpeechRecognitionEvent('start', () => {
    if (Platform.OS === 'ios') {
      // Small delay to ensure audio session is fully configured
      setTimeout(() => {
        try {
          const success = AudioSessionConfig.enableHapticsDuringRecording();
          console.log('Haptics enabled after speech recognition started:', success);
          console.log('Haptics enabled status:', AudioSessionConfig.isHapticsEnabled());
        } catch (error) {
          console.warn('Failed to enable haptics after start:', error);
        }
      }, 100);
    }
  });

  // Handle partial results for real-time detection
  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResultEvent) => {
    const transcript = event.results[0]?.transcript || '';
    if (transcript) {
      console.log('Transcript:', transcript);
      onTranscriptRef.current(transcript.toLowerCase());
    }
  });

  // Auto-restart when recognition ends (handles iOS 60-second limit)
  useSpeechRecognitionEvent('end', () => {
    if (shouldBeListening.current) {
      // Small delay before restart to ensure clean state
      setTimeout(() => {
        if (shouldBeListening.current) {
          startListeningInternal();
        }
      }, 100);
    } else {
      setIsListening(false);
    }
  });

  // Handle errors
  useSpeechRecognitionEvent('error', (event) => {
    console.warn('Speech recognition error:', event.error);
    // Try to restart on error if we should still be listening
    if (shouldBeListening.current) {
      setTimeout(() => {
        if (shouldBeListening.current) {
          startListeningInternal();
        }
      }, 500);
    }
  });

  const startListeningInternal = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        requiresOnDeviceRecognition: true,
        continuous: true,
      });
      setIsListening(true);
    } catch (error) {
      console.warn('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  }, []);

  const start = useCallback(async () => {
    // Request permissions
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setPermissionStatus('denied');
      return;
    }
    setPermissionStatus('granted');

    shouldBeListening.current = true;
    startListeningInternal();
  }, [startListeningInternal]);

  const stop = useCallback(() => {
    shouldBeListening.current = false;
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);

    // Disable haptics during recording when stopping
    if (Platform.OS === 'ios') {
      try {
        AudioSessionConfig.disableHapticsDuringRecording();
      } catch (error) {
        console.warn('Failed to disable haptics during recording:', error);
      }
    }
  }, []);

  // Stop when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active' && shouldBeListening.current) {
        stop();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (shouldBeListening.current) {
        ExpoSpeechRecognitionModule.stop();
        if (Platform.OS === 'ios') {
          try {
            AudioSessionConfig.disableHapticsDuringRecording();
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    };
  }, []);

  return { isListening, permissionStatus, start, stop };
}
