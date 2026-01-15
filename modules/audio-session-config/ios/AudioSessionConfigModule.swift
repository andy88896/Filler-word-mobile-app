import ExpoModulesCore
import AVFoundation

public class AudioSessionConfigModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioSessionConfig")

    /// Enables haptics and system sounds during audio recording
    /// This must be called BEFORE starting speech recognition
    Function("enableHapticsDuringRecording") { () -> Bool in
      do {
        let audioSession = AVAudioSession.sharedInstance()

        // Configure audio session for playAndRecord with haptics enabled
        try audioSession.setCategory(
          .playAndRecord,
          mode: .measurement,
          options: [.defaultToSpeaker, .allowBluetooth]
        )

        // Enable haptics during recording - this is the key setting!
        try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)

        // Activate the session
        try audioSession.setActive(true)

        return true
      } catch {
        print("AudioSessionConfig: Failed to configure audio session: \(error)")
        return false
      }
    }

    /// Disables the haptics during recording setting and deactivates audio session
    Function("disableHapticsDuringRecording") { () -> Bool in
      do {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(false)
        try audioSession.setActive(false, options: .notifyOthersOnDeactivation)
        return true
      } catch {
        print("AudioSessionConfig: Failed to disable haptics: \(error)")
        return false
      }
    }

    /// Check if haptics during recording is currently enabled
    Function("isHapticsEnabled") { () -> Bool in
      let audioSession = AVAudioSession.sharedInstance()
      return audioSession.allowHapticsAndSystemSoundsDuringRecording
    }

    /// Trigger a haptic feedback using AudioServices (low-level, more reliable)
    Function("triggerSystemHaptic") { (style: String) -> Void in
      // System sound IDs for haptics:
      // 1519 = Peek (strong)
      // 1520 = Pop (weak)
      // 1521 = Cancelled
      // 1102 = Tink
      var soundID: SystemSoundID = 1519 // Default to strong (peek)

      switch style {
      case "strong":
        soundID = 1519
      case "medium":
        soundID = 1520
      case "weak":
        soundID = 1521
      default:
        soundID = 1519
      }

      AudioServicesPlaySystemSound(soundID)
    }
  }
}
