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
