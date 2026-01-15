import ExpoModulesCore
import AVFoundation
import AudioToolbox
import UIKit

public class AudioSessionConfigModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioSessionConfig")

    /// Enables haptics and system sounds during audio recording
    /// This can be called AFTER speech recognition has configured the audio session
    /// It will enable haptics on the existing session without reconfiguring it
    Function("enableHapticsDuringRecording") { () -> Bool in
      do {
        let audioSession = AVAudioSession.sharedInstance()

        // Just enable haptics on the current session - don't reconfigure!
        // This allows expo-speech-recognition to set up the session first,
        // then we just flip the haptics flag
        try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)

        print("AudioSessionConfig: Haptics enabled on existing session")
        print("AudioSessionConfig: Category: \(audioSession.category.rawValue)")
        print("AudioSessionConfig: Mode: \(audioSession.mode.rawValue)")
        print("AudioSessionConfig: allowHapticsAndSystemSoundsDuringRecording: \(audioSession.allowHapticsAndSystemSoundsDuringRecording)")

        return true
      } catch {
        print("AudioSessionConfig: Failed to enable haptics: \(error)")
        return false
      }
    }

    /// Disables the haptics during recording setting
    Function("disableHapticsDuringRecording") { () -> Bool in
      do {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(false)
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

    /// Trigger a haptic feedback using AudioServices (low-level, most reliable during recording)
    /// This works because AudioServicesPlaySystemSound operates at the AudioToolbox level,
    /// below where audio session conflicts occur
    Function("triggerSystemHaptic") { (style: String) -> Void in
      // First, ensure haptics are still enabled (they might have been reset)
      let audioSession = AVAudioSession.sharedInstance()
      if !audioSession.allowHapticsAndSystemSoundsDuringRecording {
        try? audioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)
        print("AudioSessionConfig: Re-enabled haptics during triggerSystemHaptic")
      }

      // Use AudioServicesPlaySystemSound - this is the most reliable method during recording
      // These system sound IDs trigger haptic feedback on supported devices:
      // 1519 = Peek (strong tap)
      // 1520 = Pop (medium tap)
      // 1521 = Cancelled/Try Again (weak double-tap)
      var soundID: SystemSoundID

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

      // Play the system sound (triggers haptic)
      AudioServicesPlaySystemSound(soundID)
      print("AudioSessionConfig: Triggered haptic with soundID \(soundID)")
    }

    /// Alternative haptic using UIImpactFeedbackGenerator (may work better in some cases)
    AsyncFunction("triggerImpactHaptic") { (style: String) in
      await MainActor.run {
        let impactStyle: UIImpactFeedbackGenerator.FeedbackStyle
        switch style {
        case "heavy":
          impactStyle = .heavy
        case "medium":
          impactStyle = .medium
        case "light":
          impactStyle = .light
        case "rigid":
          impactStyle = .rigid
        case "soft":
          impactStyle = .soft
        default:
          impactStyle = .heavy
        }

        let generator = UIImpactFeedbackGenerator(style: impactStyle)
        generator.prepare()
        generator.impactOccurred()
        print("AudioSessionConfig: Triggered UIImpactFeedbackGenerator with style \(style)")
      }
    }
    .runOnQueue(.main)

    /// Trigger notification haptic (success/warning/error patterns)
    AsyncFunction("triggerNotificationHaptic") { (type: String) in
      await MainActor.run {
        let notificationType: UINotificationFeedbackGenerator.FeedbackType
        switch type {
        case "success":
          notificationType = .success
        case "warning":
          notificationType = .warning
        case "error":
          notificationType = .error
        default:
          notificationType = .error
        }

        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(notificationType)
        print("AudioSessionConfig: Triggered UINotificationFeedbackGenerator with type \(type)")
      }
    }
    .runOnQueue(.main)
  }
}
