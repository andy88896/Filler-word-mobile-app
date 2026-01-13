import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSpeechRecognition } from './src/hooks/useSpeechRecognition';
import { useFillerDetection } from './src/hooks/useFillerDetection';

export default function App() {
  const { checkForFillers, reset } = useFillerDetection();
  const { isListening, permissionStatus, start, stop } =
    useSpeechRecognition(checkForFillers);

  // Keep screen awake while app is open
  useKeepAwake();

  const handleStart = () => {
    reset();
    start();
  };

  const handleEnd = () => {
    stop();
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  // Permission denied screen
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.deniedText}>
          This app needs microphone access to detect filler words in your speech
          and provide real-time vibration feedback.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={openSettings}
        >
          <Text style={styles.buttonText}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {!isListening ? (
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.endButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleEnd}
        >
          <Text style={styles.buttonText}>End</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  deniedText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 320,
  },
});
