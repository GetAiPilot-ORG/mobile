# Mobile visual system

The user's reference governs this redesign: a pale lavender canvas, white rounded content surfaces, mint, lavender, peach, and pink accents, clear dark text, and compact ink action pills. This is an operational mobile interface.

## Foundations

- Light canvas: #F5F3FB. White content cards. Secondary surfaces: #F0EEF8 and #F8F7FC.
- Ink: #202027. Secondary text: #696575. Lavender navigation and links: #6C55C5.
- Primary actions use #17171C with white text. Dark mode uses lavender actions with dark text.
- Content corners are generally 24px, inputs 18px, and small actions and filters pill shaped.
- Native system typography follows the platform. Main mobile headings use 30–34px, medium weight, with ordinary body and field text at readable sizes.
- Default appearance is light to match the reference; saved appearance preferences and the system appearance option remain supported.

## Composition

Home leads with a short heading and pastel product shortcuts. Workspace counts come from existing queries. Creation tools scroll horizontally. Plans, security, and referrals remain accessible in compact blocks.

Tools and Activity use direct headings instead of promotional hero cards and telemetry badges. Tools, Activity, and Inbox use discrete rounded selectors, without the former continuous baseline and folder outlines.

Navigation uses a solid rounded surface with soft elevation. Selected tabs use a pastel background. Product overflow navigation preserves its existing behavior.

## Content and states

Remove duplicate category labels, unsupported activity claims, repeated marketing copy, and decorative outlines around content surfaces. Keep useful descriptions, error recovery, legal and billing information, selected controls, and status indicators.

Shared cards, buttons, inputs, search, product and metric cards follow the same visual system. Legacy neutral palettes and explicitly named content card styles are aligned throughout feature screens, account, authentication, tools, and loading states. Product brand accents remain meaningful identifiers.

## Verification limits

Type checking and Expo export verify source and bundling. Authenticated workflows still require an account for visual inspection. No Android emulator was connected during implementation; native screenshots and touch behavior have not been verified on a device.

## Product-specific compositions

The product dashboards are now structurally redesigned, in addition to their shared theme. Telegram organizes community tools around a mint forwarding panel; WhatsApp leads with the connected account and audience; Voice leads with minutes and assistants; CRM leads with pipeline and follow-ups; Social leads with connected channels and scheduled posts. Each has its own content hierarchy.

ProductUI provides shared headings, sections, metric strips, action tiles, list rows, and empty states. At standard phone widths three action tiles fit in a row; narrow screens and larger font scales use a horizontal carousel to avoid breaking words.

The individual product previews and verification scope are documented in docs/design/README.md. They render real components using synthetic sample data, with no production authentication changes.

## Incoming update integration — 13 October 2026

The remote update is integrated while preserving the minimal dashboards and palette. Telegram receives updated list controls, search/filter/load-more behavior, and summary counts; detailed screens retain the existing corner and typography styles. Tracking links retain lightweight user data for conversion metrics, and active counts exclude departed members.

Plans uses the incoming Pro/modular selector, package details, and persistent checkout action, adapted to pastel accents and ink buttons. Monthly billing remains the initial choice.

Motion stays functional: a 180ms startup logo fade, 100/140ms button press feedback, and 180ms tab transitions. Reduce Motion disables spatial feedback and modal/tab transitions. There are no looping gradients, glowing headers, or forced two-second startup delays.

Native payment support is retained with the existing modal fallback when the SDK is unavailable. The SDK loads lazily, and a payment cannot be reported successful when server verification fails. Native failures remain visible when callers omit a failure callback.

### Native card styling

Pressables with function-based inline styles use `cssInterop={false}`. NativeWind's native style processing does not preserve these callbacks, causing missing backgrounds and layout on Android. Keep className-based controls on the normal interop path. This fix retains the pastel palette and native pressed feedback.

### Tab motion

Top-level tabs shift in 220ms. Shared app and product docks use a 140–220ms selected-state transition with a clear 3px lift, 7.5% scale, and opacity change while the active pill resizes. Motion is interruptible and uses native-driven transforms. Reduce Motion removes the screen transition and spatial movement while retaining the selected color and label state.
