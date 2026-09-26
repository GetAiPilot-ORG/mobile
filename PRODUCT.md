# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

The primary users are business owners who personally monitor and operate their business calling workflows from a phone. They need to understand performance quickly and take action without navigating a call-center-style console.

## Product Purpose

GetAiPilot Mobile brings the GetAiPilot automation ecosystem to iOS and Android. VoicePilot lets business owners manage AI voice assistants, outbound campaigns, call activity, customer contacts, dedicated numbers, and voice credit usage. Success means an owner can understand what is happening, spot issues, and launch the next action within seconds.

## Positioning

VoicePilot combines AI voice-assistant configuration, automated telecalling campaigns, live call records, customer contacts, and usage credits inside the broader GetAiPilot business automation workspace.

## Operating Context

Owners use VoicePilot in short mobile sessions throughout the day: checking operational health, reviewing calls, starting or pausing campaigns, maintaining contacts, and triggering individual calls. The interface consumes authenticated live data through the mobile BFF and VoicePilot services.

## Capabilities and Constraints

- Preserve the current Overview, Calls, Campaigns, and Contacts navigation and all working create, edit, inspect, call, campaign, dedicated-number, and KYC flows.
- Dashboard and list content must use live backend data; do not fabricate operational values or fallback records.
- The app uses React Native 0.86, Expo SDK 57, Expo Router, TypeScript, TanStack Query, and Supabase-backed services.
- The experience ships across iOS and Android and should respect each platform's navigation, back behavior, safe areas, touch targets, typography scaling, reduced motion, and light/dark appearance.
- VoicePilot is one product area inside GetAiPilot Mobile; global application navigation and authentication remain shared.

## Brand Commitments

Keep the GetAiPilot and VoicePilot names. Product language should be concise, reassuring, operational, and understandable to a business owner rather than written for technical call-center staff.

## Evidence on Hand

- The canonical VoicePilot web implementation and database-backed dashboard live in `/home/metabull/Projects/GAP_VoicePilot`.
- Existing mobile product flows and backend integration live under `src/features/voice` and `Getaipilot-bff/src`.
- No testimonials, performance claims, or illustrative business data should be invented.

## Product Principles

1. Show business health at a glance.
2. Make the next useful action obvious.
3. Prefer real operational truth over decorative analytics.
4. Keep advanced detail available without crowding everyday workflows.
5. Feel native, trustworthy, and comfortable in one-handed use.

## Accessibility & Inclusion

Support system text scaling, light and dark appearances, reduced motion, screen-reader labels, and platform-appropriate minimum touch targets.
