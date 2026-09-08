# GetAiPilot Mobile Engineering & Platform Architecture Guide (`MOBILE_ARCHITECTURE_GUIDE.md`)

This guide serves as the **Definitive Engineering Handbook and Technical Reference** for GetAiPilot mobile development across iOS and Android. Whenever planning, designing, or implementing new features, consult the specific architectural patterns and official platform resources documented below.

---

## 1. Master Documentation & Platform Resources Index

| Domain / Topic | Official Apple Resource | Official Android Resource |
| :--- | :--- | :--- |
| **Getting Started & Core Architecture** | [Apple iOS Get Started](https://developer.apple.com/ios/get-started/) • [Apple Developer Documentation](https://developer.apple.com/documentation) | [Android Developer Guide](https://developer.android.com/develop) • [Android App Architecture](https://developer.android.com/topic/architecture) |
| **Design System & UI Guidelines** | [Apple Human Interface Guidelines (HIG)](https://developer.apple.com/design/human-interface-guidelines) • [iOS Resources](https://developer.apple.com/ios/resources/) | [Android UI Architecture](https://developer.android.com/develop/ui) • [Material 3 Design](https://m3.material.io/) |
| **Permissions & Privacy Models** | [Apple User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/) | [Android Permissions Overview](https://developer.android.com/guide/topics/permissions/overview) |
| **Authentication & Biometrics** | [Apple LocalAuthentication (Face ID / Touch ID)](https://developer.apple.com/documentation/localauthentication) | [Android Credential Manager](https://developer.android.com/identity/credential-manager) • [Android BiometricPrompt](https://developer.android.com/training/sign-in/biometric-auth) |
| **Data Storage & Security** | [Apple Keychain Services](https://developer.apple.com/documentation/security/keychain_services) | [Android Data Storage Overview](https://developer.android.com/training/data-storage) |
| **Navigation & Flow Management** | [Apple Navigation & Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | [Android Navigation Architecture](https://developer.android.com/guide/navigation/use-graph/navigate) |
| **Background Tasks & Jobs** | [Apple Background Tasks Framework](https://developer.apple.com/documentation/backgroundtasks) | [Android Background Work & WorkManager](https://developer.android.com/develop/background-work/background-tasks) |
| **Sensors & Haptics** | [Apple Core Haptics](https://developer.apple.com/documentation/corehaptics) | [Android Sensors Overview](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview) |
| **Location & Geofencing** | [Apple Core Location](https://developer.apple.com/documentation/corelocation) | [Android Location Overview](https://developer.android.com/develop/sensors-and-location/location) |
| **Network & Connectivity** | [Apple Network Framework](https://developer.apple.com/documentation/network) | [Android Connectivity Overview](https://developer.android.com/develop/connectivity) |
| **Camera & Media Capture** | [Apple AVFoundation Camera](https://developer.apple.com/documentation/avfoundation/cameras_and_media_capture) | [Android Camera Library Selection](https://developer.android.com/media/camera/choose-camera-library) |

---

## 2. Permissions Architecture & Pre-Permission Primers

### A. The 2-Step Permission Law (Apple HIG & Google Play Policy)
1. **Never request raw system permissions on cold launch.** Immediate system popups result in >75% rejection rates and risk App Store rejection under **Apple Guideline 5.1.1** (Data Collection & Storage).
2. **Context First (Pre-Permission Primer):** Show an in-app visual card (e.g. Onboarding Step 3) explaining the concrete value proposition before triggering the native OS dialog.

```
[ In-App Feature / Onboarding Card ] ──► [ Explains User Benefit ] ──► [ User Taps 'Enable' ] ──► [ Native OS Dialog ]
```

### B. Permission Implementation Standards
- **Face ID / Biometrics:**
  - iOS requires `NSFaceIDUsageDescription` in `infoPlist`.
  - Trigger with `disableDeviceFallback: true` to invoke the native **TrueDepth Camera HUD** directly.
  - Fallback to Passcode only when user explicitly chooses passcode or biometrics fail.
- **Push Notifications:**
  - Register only during Onboarding Step 3 or when user initiates an alert-reliant action.
  - Respect system authorization status (`granted`, `denied`, `provisional`).
- **Location:**
  - Always request `WhenInUse` / Foreground location first; never request `Always` / Background location upfront without prior foreground usage.

---

## 3. Biometric & Credential Management

### A. Security Enclave & TEE Abstraction
- Raw biometric data never touches JavaScript or application memory.
- iOS checks Apple's **Secure Enclave** chip via `LocalAuthentication`.
- Android checks the hardware-backed **Trusted Execution Environment (TEE)** or Titan Security Chip via `Credential Manager` / `BiometricPrompt`.

### B. Grace-Period & Re-Lock Lifecycle Protection
- **AppState Isolation:** OS system modals (Face ID HUD, Passcode keypad, notification shade) fire `AppState: inactive`. **Do NOT trigger auto-lock on `inactive` transitions.**
- **True Background Lock:** Auto-lock evaluates only when transitioning from `background` (user swiped home) to `active`.
- **Unlock Buffer:** Maintain an in-memory post-unlock cooldown timestamp (3,000ms) to eliminate flickering re-lock loops.

---

## 4. UI/UX Design System & Native Aesthetics

### A. Typography & Text Hierarchy (SF Pro & Roboto)
| Level | Font Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Large Title / Hero** | `28px` | `800` (Bold) | `34px` | `-0.6px` |
| **Title 1 / Page Title** | `22px` - `24px` | `700` (Bold) | `28px` | `-0.4px` |
| **Title 2 / Card Header** | `18px` | `700` (Bold) | `24px` | `-0.2px` |
| **Body / Form Inputs** | `15px` - `16px` | `400` / `500` | `22px` | `-0.2px` |
| **Subhead / Captions** | `13px` - `14px` | `500` / `600` | `18px` | `0px` |
| **Footnote / Badges** | `11px` - `12px` | `700` (Bold) | `16px` | `+0.2px` |

### B. Color Tokens & OLED Dark Canvas
- **Background Canvas:** Pure OLED Black (`#000000`) in dark mode; Clean neutral (`#F8F9FA`) in light mode.
- **Surface Grouped / Elevated:** `#1C1C1E` (Dark) / `#FFFFFF` (Light) with 1px `#2C2C2E` / `#E5E7EB` border.
- **Pill Badges & Squircles:** 32×32 or 40×40 rounded squares (`borderRadius: 12px` to `16px`) with 15% opacity tint backgrounds and semantic stroke colors.

### C. Tactile Sensory Haptics
- **Light (`Haptics.ImpactFeedbackStyle.Light`):** Segment switches, tab bar navigation, filter pill toggles.
- **Medium (`Haptics.ImpactFeedbackStyle.Medium`):** Form submissions, primary CTA clicks, onboarding step advancements.
- **Success Notification (`Haptics.NotificationFeedbackType.Success`):** Biometric unlock verified, profile saved, plan upgraded.
- **Error Notification (`Haptics.NotificationFeedbackType.Error`):** Validation failure, authentication error.

---

## 5. Storage Hierarchy & State Synchronization

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Data Storage Layers                             │
├────────────────────────────┬───────────────────────────────────────────┤
│ Sensitive Secrets / Tokens │ SecureStore (iOS Keychain / Android Enc.) │
├────────────────────────────┼───────────────────────────────────────────┤
│ Preferences & Config Flags │ AsyncStorage / MMKV                       │
├────────────────────────────┼───────────────────────────────────────────┤
│ Server State & Cache       │ TanStack Query (with 10-min gcTime)       │
├────────────────────────────┼───────────────────────────────────────────┤
│ Database Entities          │ Supabase PostgreSQL via Client            │
└────────────────────────────┴───────────────────────────────────────────┘
```

---

## 6. Pre-Implementation Checklist (Before Writing Any New Feature)

Before writing or modifying any mobile feature:
1. **Consult Master Resource Table:** Check official Apple & Android documentation links in Section 1.
2. **Review Apple HIG & Material 3 Principles:** Ensure layouts, typography weights, and touch targets (minimum 44×44pt) comply.
3. **Verify Permission Primers:** If introducing device capabilities (Microphone, Camera, Contacts, Push), design the in-app primer card first.
4. **Enforce OLED Dark Mode Compatibility:** Zero hardcoded white backgrounds on scroll views or elevated cards.
5. **Validate TypeScript Strictness:** Ensure `npx tsc --noEmit` passes with 0 errors.
