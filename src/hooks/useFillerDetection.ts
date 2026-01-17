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
 * Haptic burst configuration
 * Fires multiple haptics in rapid succession for a stronger, more noticeable sensation
 */
const HAPTIC_BURST_CONFIG = {
  // Number of haptic pulses in the burst
  pulseCount: 5,
  // Delay between pulses in milliseconds (50-80ms feels like one strong vibration)
  pulseDelayMs: 60,
};

/**
 * Trigger a single haptic pulse using the most reliable method during recording
 */
function triggerSingleHaptic(style: 'heavy' | 'rigid' | 'error' | 'system') {
  if (Platform.OS !== 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    return;
  }

  switch (style) {
    case 'error':
      // Notification error is one of the strongest built-in patterns
      AudioSessionConfig.triggerNotificationHaptic('error').catch(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      });
      break;
    case 'system':
      // AudioServicesPlaySystemSound(1519) - most reliable during recording
      AudioSessionConfig.triggerSystemHaptic('strong');
      break;
    case 'heavy':
      AudioSessionConfig.triggerImpactHaptic('heavy').catch(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      });
      break;
    case 'rigid':
    default:
      AudioSessionConfig.triggerImpactHaptic('rigid').catch(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      });
      break;
  }
}

/**
 * Trigger a burst of haptic feedback for maximum noticeability
 * Fires multiple haptics in rapid succession creating a stronger sensation
 */
function triggerHapticBurst() {
  const { pulseCount, pulseDelayMs } = HAPTIC_BURST_CONFIG;

  // First pulse: system haptic (most reliable during recording)
  triggerSingleHaptic('system');

  // Subsequent pulses with delays
  for (let i = 1; i < pulseCount; i++) {
    setTimeout(() => {
      // Alternate between system and heavy for varied sensation
      triggerSingleHaptic(i % 2 === 0 ? 'system' : 'heavy');
    }, pulseDelayMs * i);
  }

  console.log(`Haptic burst: ${pulseCount} pulses, ${pulseDelayMs}ms apart`);
}

/**
 * Trigger haptic feedback - uses burst pattern for stronger sensation
 */
function triggerHaptic() {
  triggerHapticBurst();
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
