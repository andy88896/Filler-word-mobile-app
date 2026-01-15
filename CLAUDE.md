# Filler Word Coach

iOS app that provides real-time haptic feedback when users speak filler words during speech.

## Tech Stack

- **Framework**: React Native + Expo (managed workflow)
- **Language**: TypeScript
- **Speech Recognition**: `expo-speech-recognition` (wraps iOS SFSpeechRecognizer)
- **Haptics**: Custom native module + `expo-haptics` fallback
- **Build System**: EAS Build (cloud-based, no Mac required)
- **Target**: iOS 15.1+, iPhone only

## Project Structure

```
├── App.tsx                    # Main entry point, UI with Start/End buttons
├── src/
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts  # Speech recognition + auto-restart logic
│   │   └── useFillerDetection.ts    # Filler word matching + haptic triggering
│   └── constants/
│       └── fillerWords.ts           # Filler word list and regex patterns
├── modules/
│   └── audio-session-config/        # Custom native module for iOS haptics
│       ├── index.ts                 # TypeScript interface
│       └── ios/
│           └── AudioSessionConfigModule.swift  # Native Swift implementation
├── app.json                   # Expo config (permissions, bundle ID)
└── eas.json                   # EAS Build configuration
```

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for iOS (cloud build, no Mac needed)
eas build --platform ios --profile development

# Build production iOS app
eas build --platform ios --profile production
```

## Key Technical Constraints

### iOS Audio Session + Haptics Conflict
iOS disables haptics during audio recording by default. The workaround:
1. Let `expo-speech-recognition` configure the audio session first
2. Enable haptics AFTER via `setAllowHapticsAndSystemSoundsDuringRecording(true)`
3. See: `src/hooks/useSpeechRecognition.ts:36-49`

### iOS 60-Second Speech Recognition Limit
iOS terminates speech recognition after ~60 seconds. Auto-restart logic handles this.
See: `src/hooks/useSpeechRecognition.ts:60-72`

### Native Module Changes Require Rebuild
Changes to `modules/audio-session-config/ios/*.swift` require a new EAS build.
TypeScript changes in `src/` can use hot reload.

## Modifying Filler Words

Edit the word list in `src/constants/fillerWords.ts:2-15`. No rebuild required.
