import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface AudioSessionConfigModule extends NativeModule {
  /**
   * Enables haptics and system sounds during audio recording.
   * Must be called BEFORE starting speech recognition.
   * @returns true if successful, false if failed
   */
  enableHapticsDuringRecording(): boolean;

  /**
   * Disables haptics during recording and deactivates audio session.
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
   * This may work even when higher-level haptic APIs are blocked.
   * @param style - 'strong', 'medium', or 'weak'
   */
  triggerSystemHaptic(style: 'strong' | 'medium' | 'weak'): void;
}

export default requireNativeModule<AudioSessionConfigModule>('AudioSessionConfig');
