import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

interface ArtworkProps {
  size?: number;
  opacity?: number;
}

/**
 * 1. TELEGRAM: Supersonic 3D Paper Plane & Radar Broadcast Nodes
 */
export function TelegramCenterArtwork({ size = 220, opacity = 0.18 }: ArtworkProps) {
  return (
    <View style={{ width: size, height: size, opacity }}>
      <Svg viewBox="0 0 240 240" width="100%" height="100%">
        <Defs>
          <LinearGradient id="tgGrad1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
            <Stop offset="50%" stopColor="#0284C7" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#0369A1" stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id="tgGradWing" x1="0" y1="0" x2="0.8" y2="0.8">
            <Stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.6" />
          </LinearGradient>
          <RadialGradient id="tgRadarGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <Stop offset="70%" stopColor="#0284C7" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Radar Glow */}
        <Circle cx="120" cy="120" r="100" fill="url(#tgRadarGlow)" />

        {/* Concentric Sonic Radar Waves */}
        <Circle
          cx="120"
          cy="120"
          r="92"
          stroke="#0284C7"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          fill="none"
          opacity="0.5"
        />
        <Circle
          cx="120"
          cy="120"
          r="72"
          stroke="#38BDF8"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <Circle
          cx="120"
          cy="120"
          r="48"
          stroke="#0284C7"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.4"
        />

        {/* Dynamic Speed & Relay Vector Nodes */}
        <Path
          d="M 40 160 Q 90 140 140 90"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeDasharray="4 8"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M 60 185 Q 110 165 160 115"
          stroke="#0284C7"
          strokeWidth="1.5"
          fill="none"
          opacity="0.45"
        />

        {/* Relay Nodes / Orbit Dots */}
        <Circle cx="50" cy="155" r="4.5" fill="#38BDF8" />
        <Circle cx="85" cy="142" r="3.5" fill="#0284C7" />
        <Circle cx="190" cy="70" r="5" fill="#38BDF8" />
        <Circle cx="205" cy="100" r="3" fill="#BAE6FD" />
        <Circle cx="35" cy="95" r="4" fill="#0284C7" opacity="0.7" />

        {/* Supersonic 3D Plane - Main Body */}
        <G transform="translate(10, -5)">
          {/* Main Top Wing */}
          <Path
            d="M 180 50 L 55 125 L 115 145 Z"
            fill="url(#tgGrad1)"
          />
          {/* Under Wing Fold */}
          <Path
            d="M 180 50 L 115 145 L 140 180 Z"
            fill="url(#tgGradWing)"
          />
          {/* Center Crease / Fin */}
          <Path
            d="M 180 50 L 130 155 L 115 145 Z"
            fill="#0369A1"
            opacity="0.85"
          />
          {/* Vapor Trail Streak */}
          <Path
            d="M 140 180 L 125 198 L 132 170 Z"
            fill="#38BDF8"
            opacity="0.9"
          />
        </G>
      </Svg>
    </View>
  );
}

/**
 * 2. WHATSAPP: 3D Holographic Broadcast Waves & Dual Chat Pillars
 */
export function WhatsAppCenterArtwork({ size = 220, opacity = 0.18 }: ArtworkProps) {
  return (
    <View style={{ width: size, height: size, opacity }}>
      <Svg viewBox="0 0 240 240" width="100%" height="100%">
        <Defs>
          <LinearGradient id="waGrad1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#34D399" stopOpacity="1" />
            <Stop offset="60%" stopColor="#10B981" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id="waBubbleGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </LinearGradient>
          <RadialGradient id="waRadialGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
            <Stop offset="65%" stopColor="#059669" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Center Glow */}
        <Circle cx="120" cy="120" r="95" fill="url(#waRadialGlow)" />

        {/* Omnidirectional Broadcast Rings */}
        <Circle
          cx="120"
          cy="120"
          r="94"
          stroke="#10B981"
          strokeWidth="1.2"
          strokeDasharray="5 5"
          fill="none"
          opacity="0.4"
        />
        <Circle
          cx="120"
          cy="120"
          r="76"
          stroke="#34D399"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <Circle
          cx="120"
          cy="120"
          r="56"
          stroke="#10B981"
          strokeWidth="1.2"
          fill="none"
          opacity="0.4"
        />

        {/* Broadcast Radio Waves Arching Right */}
        <Path
          d="M 155 85 A 45 45 0 0 1 155 155"
          stroke="#34D399"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 172 70 A 68 68 0 0 1 172 170"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <Path
          d="M 188 55 A 90 90 0 0 1 188 185"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* Dual Floating Conversation Bubbles */}
        {/* Primary Large Bubble */}
        <G transform="translate(42, 60)">
          <Path
            d="M 18 0 C 8 0 0 8 0 18 C 0 35 15 50 32 50 L 32 64 L 46 50 C 68 50 78 40 78 24 C 78 10 68 0 50 0 Z"
            fill="url(#waGrad1)"
          />
          {/* Chat Lines inside bubble */}
          <Rect x="16" y="14" width="44" height="4" rx="2" fill="#FFFFFF" opacity="0.9" />
          <Rect x="16" y="24" width="32" height="4" rx="2" fill="#FFFFFF" opacity="0.75" />
          <Rect x="16" y="34" width="22" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
        </G>

        {/* Secondary Response Bubble */}
        <G transform="translate(100, 115)">
          <Path
            d="M 14 0 C 6 0 0 6 0 14 C 0 26 12 38 24 38 L 24 48 L 34 38 C 50 38 58 30 58 18 C 58 8 50 0 38 0 Z"
            fill="url(#waBubbleGrad)"
          />
          {/* Double Checkmark */}
          <Path
            d="M 18 19 L 24 25 L 36 13 M 28 25 L 40 13"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>

        {/* Connection Pulse Nodes */}
        <Circle cx="48" cy="180" r="4" fill="#34D399" />
        <Circle cx="76" cy="195" r="3" fill="#10B981" />
        <Circle cx="195" cy="120" r="4" fill="#34D399" />
      </Svg>
    </View>
  );
}

/**
 * 3. VOICE AI: 3D Oscillating Sound Sphere & Frequency Spectrum Rings
 */
export function VoiceAICenterArtwork({ size = 220, opacity = 0.18 }: ArtworkProps) {
  return (
    <View style={{ width: size, height: size, opacity }}>
      <Svg viewBox="0 0 240 240" width="100%" height="100%">
        <Defs>
          <LinearGradient id="voiceGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#C084FC" stopOpacity="1" />
            <Stop offset="50%" stopColor="#9333EA" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#6B21A8" stopOpacity="0.8" />
          </LinearGradient>
          <RadialGradient id="voiceRadial" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#7C3AED" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Center Glow */}
        <Circle cx="120" cy="120" r="95" fill="url(#voiceRadial)" />

        {/* Concentric Audio Frequency Waves */}
        <Circle
          cx="120"
          cy="120"
          r="92"
          stroke="#9333EA"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          fill="none"
          opacity="0.4"
        />
        <Circle
          cx="120"
          cy="120"
          r="74"
          stroke="#C084FC"
          strokeWidth="1.6"
          fill="none"
          opacity="0.55"
        />

        {/* Orbital Sound Wave Rings (Tilted 3D Orbit) */}
        <Path
          d="M 30 120 C 30 90 210 90 210 120 C 210 150 30 150 30 120"
          stroke="#A855F7"
          strokeWidth="1.8"
          strokeDasharray="8 4"
          fill="none"
          transform="rotate(-25 120 120)"
          opacity="0.6"
        />
        <Path
          d="M 45 120 C 45 95 195 95 195 120 C 195 145 45 145 45 120"
          stroke="#C084FC"
          strokeWidth="1.2"
          fill="none"
          transform="rotate(35 120 120)"
          opacity="0.5"
        />

        {/* Central Audio Waveform Bars (Vertical Spectrum) */}
        <G transform="translate(68, 75)">
          <Rect x="0" y="32" width="6" height="26" rx="3" fill="#C084FC" opacity="0.6" />
          <Rect x="13" y="20" width="6" height="50" rx="3" fill="#A855F7" opacity="0.8" />
          <Rect x="26" y="8" width="6" height="74" rx="3" fill="url(#voiceGrad)" />
          <Rect x="39" y="0" width="6" height="90" rx="3" fill="#E9D5FF" />
          <Rect x="52" y="12" width="6" height="66" rx="3" fill="url(#voiceGrad)" />
          <Rect x="65" y="24" width="6" height="42" rx="3" fill="#A855F7" opacity="0.8" />
          <Rect x="78" y="34" width="6" height="22" rx="3" fill="#C084FC" opacity="0.6" />
          <Rect x="91" y="40" width="6" height="10" rx="3" fill="#7C3AED" opacity="0.4" />
        </G>

        {/* Micro Audio Orbit Nodes */}
        <Circle cx="40" cy="80" r="4" fill="#C084FC" />
        <Circle cx="200" cy="160" r="4.5" fill="#A855F7" />
        <Circle cx="120" cy="30" r="3" fill="#E9D5FF" />
        <Circle cx="120" cy="210" r="3" fill="#7C3AED" />
      </Svg>
    </View>
  );
}

/**
 * 4. SMART CRM: 3D Pipeline Funnel, Revenue Graph & Trophy Emblem
 */
export function SmartCRMCenterArtwork({ size = 220, opacity = 0.18 }: ArtworkProps) {
  return (
    <View style={{ width: size, height: size, opacity }}>
      <Svg viewBox="0 0 240 240" width="100%" height="100%">
        <Defs>
          <LinearGradient id="crmGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
            <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
          </LinearGradient>
          <RadialGradient id="crmRadial" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <Stop offset="65%" stopColor="#D97706" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Center Glow */}
        <Circle cx="120" cy="120" r="95" fill="url(#crmRadial)" />

        {/* Concentric Target Circles */}
        <Circle
          cx="120"
          cy="120"
          r="92"
          stroke="#F59E0B"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          fill="none"
          opacity="0.4"
        />
        <Circle
          cx="120"
          cy="120"
          r="72"
          stroke="#FBBF24"
          strokeWidth="1.5"
          fill="none"
          opacity="0.55"
        />

        {/* 3D Funnel Geometry */}
        <Path
          d="M 60 55 L 180 55 L 140 120 L 140 185 L 100 165 L 100 120 Z"
          fill="url(#crmGrad)"
          opacity="0.85"
        />

        {/* Funnel Rim Oval */}
        <Path
          d="M 60 55 C 60 45 180 45 180 55 C 180 65 60 65 60 55"
          fill="#FDE68A"
        />

        {/* Funnel Mid Section Line */}
        <Path
          d="M 85 92 C 85 86 155 86 155 92"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="4 3"
          fill="none"
          opacity="0.8"
        />

        {/* Ascending Revenue Growth Bars */}
        <G transform="translate(135, 105)">
          <Rect x="0" y="45" width="8" height="25" rx="3" fill="#FBBF24" opacity="0.6" />
          <Rect x="14" y="28" width="8" height="42" rx="3" fill="#F59E0B" opacity="0.8" />
          <Rect x="28" y="10" width="8" height="60" rx="3" fill="#FBBF24" />
          <Rect x="42" y="-5" width="8" height="75" rx="3" fill="#FEF3C7" />
          {/* Ascending Growth Arrow */}
          <Path
            d="M -4 42 L 18 25 L 32 8 L 50 -8 M 40 -8 L 50 -8 L 50 2"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>

        {/* Floating Deal Diamond Nodes */}
        <Path
          d="M 50 140 L 60 128 L 70 140 L 60 152 Z"
          fill="#FBBF24"
        />
        <Circle cx="190" cy="80" r="4.5" fill="#F59E0B" />
        <Circle cx="45" cy="85" r="3.5" fill="#FBBF24" />
      </Svg>
    </View>
  );
}

/**
 * 5. SOCIAL PILOT: 3D Aerodynamic Booster Rocket & Orbit Broadcast Stream
 */
export function SocialPilotCenterArtwork({ size = 220, opacity = 0.18 }: ArtworkProps) {
  return (
    <View style={{ width: size, height: size, opacity }}>
      <Svg viewBox="0 0 240 240" width="100%" height="100%">
        <Defs>
          <LinearGradient id="socialGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F472B6" stopOpacity="1" />
            <Stop offset="50%" stopColor="#EC4899" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#BE185D" stopOpacity="0.8" />
          </LinearGradient>
          <RadialGradient id="socialRadial" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#EC4899" stopOpacity="0.4" />
            <Stop offset="65%" stopColor="#BE185D" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#BE185D" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Center Glow */}
        <Circle cx="120" cy="120" r="95" fill="url(#socialRadial)" />

        {/* Planetary Orbital Rings */}
        <Circle
          cx="120"
          cy="120"
          r="92"
          stroke="#EC4899"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          fill="none"
          opacity="0.4"
        />
        <Circle
          cx="120"
          cy="120"
          r="70"
          stroke="#F472B6"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />

        {/* Tilted Elliptical Orbit Track */}
        <Path
          d="M 25 120 C 25 80 215 80 215 120 C 215 160 25 160 25 120"
          stroke="#F472B6"
          strokeWidth="2"
          strokeDasharray="6 6"
          fill="none"
          transform="rotate(-35 120 120)"
          opacity="0.6"
        />

        {/* Rocket Body */}
        <G transform="translate(10, 5)">
          {/* Left Fin */}
          <Path
            d="M 85 145 L 65 170 L 92 162 Z"
            fill="#BE185D"
          />
          {/* Right Fin */}
          <Path
            d="M 135 145 L 155 170 L 128 162 Z"
            fill="#BE185D"
          />
          {/* Main Fuselage */}
          <Path
            d="M 110 50 C 90 85 85 130 92 162 L 128 162 C 135 130 130 85 110 50 Z"
            fill="url(#socialGrad)"
          />
          {/* Nose Cone Tip */}
          <Path
            d="M 110 50 C 103 62 100 75 100 85 L 120 85 C 120 75 117 62 110 50 Z"
            fill="#FCE7F3"
          />
          {/* Porthole Window */}
          <Circle cx="110" cy="105" r="11" fill="#FFFFFF" />
          <Circle cx="110" cy="105" r="8" fill="#0F172A" />
          <Circle cx="112" cy="103" r="3" fill="#38BDF8" />

          {/* Engine Thrust Flames */}
          <Path
            d="M 98 164 L 110 200 L 122 164 Z"
            fill="#FBBF24"
          />
          <Path
            d="M 103 164 L 110 188 L 117 164 Z"
            fill="#FFFFFF"
          />
        </G>

        {/* Social Network Orbit Satellites */}
        <Circle cx="50" cy="70" r="5" fill="#F472B6" />
        <Circle cx="190" cy="65" r="4" fill="#EC4899" />
        <Circle cx="185" cy="175" r="5" fill="#F472B6" />
        <Circle cx="35" cy="165" r="3.5" fill="#BE185D" />
      </Svg>
    </View>
  );
}

/**
 * Dispatcher to render the exact artwork corresponding to each product
 */
export function ProductCenterArtwork({
  productId,
  size = 210,
  opacity = 0.16,
}: {
  productId: string;
  size?: number;
  opacity?: number;
}) {
  switch (productId) {
    case 'telegram':
      return <TelegramCenterArtwork size={size} opacity={opacity} />;
    case 'whatsapp':
      return <WhatsAppCenterArtwork size={size} opacity={opacity} />;
    case 'voice':
      return <VoiceAICenterArtwork size={size} opacity={opacity} />;
    case 'crm':
      return <SmartCRMCenterArtwork size={size} opacity={opacity} />;
    case 'social':
      return <SocialPilotCenterArtwork size={size} opacity={opacity} />;
    default:
      return null;
  }
}
