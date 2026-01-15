import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface AudioSessionConfigModule extends NativeModule {
  /**
   * Enables haptics and system sounds during audio recording.
   * Can be called AFTER speech recognition starts - it will enable
   * haptics on the existing audio session without reconfiguring it.
   * @returns true if successful, false if failed
   */
  enableHapticsDuringRecording(): boolean;

  /**
   * Disables haptics during recording.
   * @returns true if successful, false if failed
   */
  disableHapticsDuringRecording(): boolean;

  /**
   * Check if haptics during recording is currently enabled.
   * @returns true if enabled, false otherwise
   */
  isHapticsEnabled(): boolean;

  /**
   * Trigger a haptic feedback using low-level AudioServices API.
   * This is the most reliable method during audio recording as it
   * operates at the AudioToolbox level, below audio session conflicts.
   * @param style - 'strong', 'medium', or 'weak'
   */
  triggerSystemHaptic(style: 'strong' | 'medium' | 'weak'): void;

  /**
   * Trigger haptic using UIImpactFeedbackGenerator.
   * @param style - 'heavy', 'medium', 'light', 'rigid', or 'soft'
   */
  triggerImpactHaptic(style: 'heavy' | 'medium' | 'light' | 'rigid' | 'soft'): Promise<void>;

  /**
   * Trigger notification haptic (success/warning/error patterns).
   * @param type - 'success', 'warning', or 'error'
   */
  triggerNotificationHaptic(type: 'success' | 'warning' | 'error'): Promise<void>;
}

export default requireNativeModule<AudioSessionConfigModule>('AudioSessionConfig');
