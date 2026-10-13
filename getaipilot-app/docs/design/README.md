# Product screen redesign

The five product dashboards have their own rebuilt compositions using the user's pastel mobile reference. These previews render the actual React Native components through React Native Web. All account names, metrics, phone numbers, and content in the preview are synthetic sample data.

| Product | Main composition | Preview |
| --- | --- | --- |
| Telegram | Community summary, forwarding panel, filtered tools | [Telegram](screens/telegram.png) |
| WhatsApp | Connected account, audience actions, broadcasts, messaging balance | [WhatsApp](screens/whatsapp.png) |
| Voice AI | Calling balance, assistants, campaigns, phone lines | [Voice AI](screens/voice.png) |
| CRM | Pipeline, follow-ups, leads, creation actions | [CRM](screens/crm.png) |
| Social | Connected channels, publishing queue, activity, plan | [Social](screens/social.png) |

## Inner screens

Calls and campaigns use new headings, compact metrics, and separate rounded list entries. Telegram tools use direct headings and quieter metrics, with the bot, account, balance, and sub-tab controls preserved. WhatsApp contacts, broadcasts, and templates have new headers and rebuilt list cards. CRM leads retain direct call, WhatsApp, and email actions in a simpler card. Social publishing has a new header and rounded sub-tab selectors.

Shared inner-screen styles align form fields, content cards, headings, and primary buttons across the five products. Redundant introductory copy and decorative borders have been removed. The template preview no longer shows fabricated timestamps or a static live status footer.

## Verification

- TypeScript and focused ESLint checks pass.
- Android export passes.
- Main dashboard previews checked at 390px and 320px; WhatsApp, CRM, and Social also checked at 768px.
- Browser interaction checks cover WhatsApp tab navigation, call and campaign forms, adding a CRM lead, and Telegram tool filtering.
- Narrow screens use horizontally scrolling action tiles so words remain intact.
- This verifies source and browser previews with sample data. Native device rendering, keyboard behavior, and live API submissions were not tested.
