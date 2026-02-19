import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Main screen for the AAPO mobile app.
 *
 * Provides:
 * - Live camera preview (used for manual emotion selection in MVP;
 *   on-device ML inference to be added in Week 5).
 * - Prompt text input.
 * - "Improve My Prompt" button that calls the backend /rewrite endpoint.
 * - Display of the rewritten prompt with Accept / Discard actions.
 */
export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [prompt, setPrompt] = useState('');
  const [rewrittenPrompt, setRewrittenPrompt] = useState('');
  const [emotionLabel, setEmotionLabel] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImprove = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setRewrittenPrompt('');

    try {
      const { data } = await axios.post(`${API_BASE}/rewrite`, {
        prompt,
        emotionLabel,
        postureLabel: 'upright', // posture detection via MediaPipe planned for Week 5
      });
      setRewrittenPrompt(data.rewrittenPrompt);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Request failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, emotionLabel]);

  const handleAccept = useCallback(() => {
    setPrompt(rewrittenPrompt);
    setRewrittenPrompt('');
  }, [rewrittenPrompt]);

  // ── Camera permission gate ─────────────────────────────────────────────────
  if (!permission) return <View style={styles.center}><ActivityIndicator color="#6c63ff" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access is needed for emotion detection.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AAPO</Text>

      {/* Camera preview */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="front" />
        <View style={styles.emotionBadge}>
          <Text style={styles.emotionBadgeText}>Detected: {emotionLabel}</Text>
        </View>
      </View>

      {/* Emotion selector (manual in MVP; auto from ML in Week 5) */}
      <Text style={styles.label}>Select your current mood:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
        {['neutral', 'happy', 'angry', 'sad', 'surprised', 'fearful'].map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.moodChip, emotionLabel === e && styles.moodChipActive]}
            onPress={() => setEmotionLabel(e)}
          >
            <Text style={[styles.moodChipText, emotionLabel === e && styles.moodChipTextActive]}>
              {e}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Prompt input */}
      <Text style={styles.label}>Your prompt</Text>
      <TextInput
        style={styles.input}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Type your message or question..."
        placeholderTextColor="#666688"
        multiline
        numberOfLines={5}
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, (!prompt.trim() || isLoading) && styles.buttonDisabled]}
        onPress={handleImprove}
        disabled={!prompt.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Improve My Prompt</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {rewrittenPrompt ? (
        <View style={styles.rewriteBox}>
          <Text style={styles.rewriteLabel}>Rewritten prompt</Text>
          <Text style={styles.rewriteText}>{rewrittenPrompt}</Text>
          <View style={styles.rewriteActions}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardButton} onPress={() => setRewrittenPrompt('')}>
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: {
    fontSize: 24, fontWeight: '700', color: '#a78bfa',
    textAlign: 'center', marginBottom: 16,
  },
  cameraContainer: {
    height: 240, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 12,
  },
  camera: { flex: 1 },
  emotionBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(15,15,26,0.8)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  emotionBadgeText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  label: { color: '#a0a0c0', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  moodRow: { marginBottom: 8 },
  moodChip: {
    borderRadius: 20, borderWidth: 1, borderColor: '#2a2a4a',
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, backgroundColor: '#16213e',
  },
  moodChipActive: { borderColor: '#6c63ff', backgroundColor: '#2a2a5a' },
  moodChipText: { color: '#8888aa', fontSize: 13 },
  moodChipTextActive: { color: '#a78bfa', fontWeight: '600' },
  input: {
    backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2a2a4a',
    borderRadius: 10, color: '#e8e8f0', fontSize: 15, lineHeight: 22,
    padding: 12, textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6c63ff', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#ff8888', fontSize: 13, marginTop: 8 },
  rewriteBox: {
    backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2a4a3a',
    borderRadius: 10, padding: 14, marginTop: 16,
  },
  rewriteLabel: { color: '#4aaa6a', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  rewriteText: { color: '#e8e8f0', fontSize: 15, lineHeight: 22 },
  rewriteActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptButton: {
    flex: 1, backgroundColor: '#1a5a3a', borderRadius: 6,
    paddingVertical: 8, alignItems: 'center',
  },
  acceptText: { color: '#4aee8a', fontWeight: '600' },
  discardButton: {
    flex: 1, backgroundColor: '#3a1a1a', borderRadius: 6,
    paddingVertical: 8, alignItems: 'center',
  },
  discardText: { color: '#ff8888', fontWeight: '600' },
  permissionText: { color: '#e8e8f0', textAlign: 'center', marginBottom: 16 },
});
