import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { registerNativeAudioBridge } from './soundFeedbackService';

/**
 * Headless Web Audio Bridge for React Native Android & iOS.
 *
 * Why this is needed:
 * React Native's Hermes engine does not have browser Web Audio API (`window.AudioContext`).
 * `@web-kits/audio` is a web synthesizer requiring Web Audio API.
 * This zero-size headless WebView executes the Web Audio API synthesizer directly
 * inside the native Android Chromium / iOS WebKit engine, routing crystal-clear
 * synthesized audio directly to the physical device speakers with zero latency!
 */

const AUDIO_BRIDGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Audio Bridge</title>
</head>
<body style="background:transparent;margin:0;padding:0;">
<script>
  (function() {
    var audioCtx = null;

    function getAudioContext() {
      try {
        if (!audioCtx || audioCtx.state === 'closed') {
          var AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      } catch(e) {}
      return audioCtx;
    }

    // Eagerly initialize on load
    document.addEventListener('DOMContentLoaded', getAudioContext);
    window.addEventListener('touchstart', getAudioContext);
    window.addEventListener('click', getAudioContext);

    // Procedural sound synthesis engine matching @web-kits/audio specifications
    window.playFeedbackSound = function(type, volumeMultiplier) {
      try {
        var ctx = getAudioContext();
        if (!ctx) return;

        var now = ctx.currentTime;
        var vol = typeof volumeMultiplier === 'number' ? volumeMultiplier : 0.85;

        if (type === 'click') {
          // Tactile Mechanical Click (1400Hz -> 300Hz sweep, 55ms)
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

          gain.gain.setValueAtTime(vol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);

        } else if (type === 'pop') {
          // Upward Bubble Pop (380Hz -> 1050Hz, 70ms)
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(1050, now + 0.065);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(vol * 0.85, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.075);

        } else if (type === 'success') {
          // Harmonic Triad Chord: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz)
          var freqs = [1046.5, 1318.5, 1567.98];
          var delays = [0, 0.04, 0.08];

          freqs.forEach(function(freq, index) {
            var o = ctx.createOscillator();
            var g = ctx.createGain();
            var start = now + delays[index];

            o.type = 'sine';
            o.frequency.setValueAtTime(freq, start);

            g.gain.setValueAtTime(0.001, start);
            g.gain.linearRampToValueAtTime(vol * (0.6 - index * 0.12), start + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

            o.connect(g);
            g.connect(ctx.destination);
            o.start(start);
            o.stop(start + 0.33);
          });

        } else if (type === 'radar') {
          // AI Radar Ping (1750Hz resonant ping with decaying tail, 160ms)
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1750, now);
          osc.frequency.exponentialRampToValueAtTime(1250, now + 0.15);

          gain.gain.setValueAtTime(vol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.17);
        }
      } catch (err) {
        // Fallback catch
      }
    };
  })();
</script>
</body>
</html>
`;

export function HeadlessAudioBridge() {
  const webViewRef = useRef<WebView | null>(null);

  useEffect(() => {
    // Only register bridge on native mobile platforms
    if (Platform.OS === 'web') return;

    const unregister = registerNativeAudioBridge((type, volume) => {
      try {
        const js = `window.playFeedbackSound && window.playFeedbackSound("${type}", ${volume}); true;`;
        webViewRef.current?.injectJavaScript(js);
      } catch {
        // Safe guard
      }
    });

    return () => {
      unregister();
    };
  }, []);

  // Not needed on web because web runs Web Audio API natively
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={webViewRef}
        style={styles.hiddenWebView}
        originWhitelist={['*']}
        source={{ html: AUDIO_BRIDGE_HTML }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    top: -20,
    left: -20,
    opacity: 0.01,
    overflow: 'hidden',
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    opacity: 0.01,
  },
});
