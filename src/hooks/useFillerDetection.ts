import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FILLER_PATTERNS } from '../constants/fillerWords';
import AudioSessionConfig from 'audio-session-config';

interface UseFillerDetectionReturn {
  checkForFillers: (transcript: string) => void;
  reset: () => void;
}

/**
 * Trigger haptic feedback using multiple methods for maximum reliability
 */
function triggerHaptic() {
  if (Platform.OS === 'ios') {
    // Try low-level AudioServices haptic first (more reliable during recording)
    try {
      AudioSessionConfig.triggerSystemHaptic('strong');
      console.log('Triggered system haptic (AudioServices)');
    } catch (error) {
      console.warn('System haptic failed, trying expo-haptics:', error);
      // Fallback to expo-haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } else {
    // For non-iOS platforms, use expo-haptics
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

export function useFillerDetection(): UseFillerDetectionReturn {
  // Track the last processed transcript length to only check new content
  const lastProcessedLength = useRef<number>(0);
  // Track detected filler positions to avoid duplicate vibrations
  const detectedPositions = useRef<Set<string>>(new Set());

  const checkForFillers = useCallback((transcript: string) => {
    // Only process new portion of the transcript
    if (transcript.length <= lastProcessedLength.current) {
      // Transcript might have been reset/corrected by speech recognition
      // Check if it's significantly shorter (indicating a new segment)
      if (transcript.length < lastProcessedLength.current - 10) {
        lastProcessedLength.current = 0;
        detectedPositions.current.clear();
      } else {
        return;
      }
    }

    // Get the portion to analyze (with some overlap for multi-word phrases)
    const overlapStart = Math.max(0, lastProcessedLength.current - 15);
    const textToAnalyze = transcript.slice(overlapStart);
    const baseOffset = overlapStart;

    // Check each filler pattern
    for (const { word, regex } of FILLER_PATTERNS) {
      // Reset regex lastIndex for fresh search
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(textToAnalyze)) !== null) {
        // Calculate absolute position in full transcript
        const absolutePosition = baseOffset + match.index;
        const positionKey = `${word}-${absolutePosition}`;

        // Only trigger haptic if we haven't detected this exact match before
        if (!detectedPositions.current.has(positionKey)) {
          detectedPositions.current.add(positionKey);

          console.log(`Filler detected: "${word}" - triggering vibration`);

          // Trigger haptic feedback
          triggerHaptic();
        }
      }
    }

    lastProcessedLength.current = transcript.length;
  }, []);

  const reset = useCallback(() => {
    lastProcessedLength.current = 0;
    detectedPositions.current.clear();
  }, []);

  return { checkForFillers, reset };
}
