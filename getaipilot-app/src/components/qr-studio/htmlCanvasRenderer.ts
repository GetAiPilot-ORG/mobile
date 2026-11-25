// @ts-ignore
import QRCode from 'qrcode';
import { CanvasConfig, CanvasTemplateId, QRStyles, getGetAiPilotLogoSvgDataUrl } from "./types";
import { TEMPLATE_BASE64_ASSETS } from "./templateBase64Assets";
import { HTML2CANVAS_SOURCE } from "./html2canvasSource";

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an animated QR SVG matching website's AnimatedCanvasQR 1:1:
 * - Excavates modules around the center logo (matching qrcode.react excavate: true)
 * - Adds 4 animated corner reticles, center ripple aura, and laser scan beam (marked data-html2canvas-ignore="true")
 */
function createAnimatedQrSvg(
  content: string,
  size: number,
  fgColor: string = '#000000',
  bgColor: string = '#ffffff',
  logoUrl?: string,
  logoScale: number = 0.18
): string {
  try {
    const qr = QRCode.create(content || 'https://getaipilot.in', {
      errorCorrectionLevel: 'H',
    });
    const modCount = qr.modules.size;
    const cellSize = size / modCount;

    // Calculate center excavation bounds in module coordinates
    const scale = logoScale || 0.18;
    const logoSize = Math.max(16, Math.round(size * scale));
    const excavatePad = 4;
    const excHalf = (logoSize / 2 + excavatePad) / cellSize;
    const centerMod = modCount / 2;

    let rects = '';
    for (let r = 0; r < modCount; r++) {
      for (let c = 0; c < modCount; c++) {
        if (qr.modules.get(r, c)) {
          if (logoUrl) {
            const dx = Math.abs(c + 0.5 - centerMod);
            const dy = Math.abs(r + 0.5 - centerMod);
            if (dx < excHalf && dy < excHalf) {
              continue;
            }
          }
          const x = (c * cellSize).toFixed(2);
          const y = (r * cellSize).toFixed(2);
          const s = (cellSize + 0.2).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fgColor}" />`;
        }
      }
    }

    let logoHtml = '';
    if (logoUrl) {
      logoHtml = `<div class="qr-center-logo" style="width:${logoSize}px;height:${logoSize}px;">` +
        `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;display:block;" />` +
        `</div>`;
    }

    const svgBg = bgColor === 'transparent' ? 'transparent' : bgColor;

    return `<div class="qr-anim-container" style="width:${size}px;height:${size}px;">` +
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background:${svgBg};display:block;">` +
      rects +
      `</svg>` +
      logoHtml +
      `<div data-html2canvas-ignore="true" class="pointer-events-none absolute inset-1.5 z-20">` +
      `<span class="absolute top-0 left-0 w-4 h-4 border-t-[2.5px] border-l-[2.5px] border-emerald-500 rounded-tl-xs animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>` +
      `<span class="absolute top-0 right-0 w-4 h-4 border-t-[2.5px] border-r-[2.5px] border-emerald-500 rounded-tr-xs animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>` +
      `<span class="absolute bottom-0 left-0 w-4 h-4 border-b-[2.5px] border-l-[2.5px] border-emerald-500 rounded-bl-xs animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>` +
      `<span class="absolute bottom-0 right-0 w-4 h-4 border-b-[2.5px] border-r-[2.5px] border-emerald-500 rounded-br-xs animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>` +
      `</div>` +
      `<div data-html2canvas-ignore="true" class="pointer-events-none absolute inset-0 flex items-center justify-center z-15">` +
      `<span class="w-9 h-9 rounded-full border border-emerald-400/50 animate-ping" style="animation-duration:2.8s;"></span>` +
      `<span class="absolute w-7 h-7 rounded-full bg-emerald-400/15 animate-pulse"></span>` +
      `</div>` +
      `<div data-html2canvas-ignore="true" class="pointer-events-none absolute inset-x-0 z-30 animate-qr-laser">` +
      `<div class="relative h-[2.5px] w-full bg-gradient-to-r from-emerald-500/30 via-emerald-400 to-emerald-500/30 shadow-[0_0_12px_3px_rgba(52,211,153,0.95)]">` +
      `<div class="absolute left-1/2 -top-[3px] -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-100 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,1)]"></div>` +
      `</div>` +
      `<div class="h-8 w-full bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent"></div>` +
      `</div>` +
      `</div>`;
  } catch (err) {
    console.error('[htmlCanvasRenderer] QR SVG generation failed:', err);
    return `<div style="width:${size}px;height:${size}px;background:${bgColor};border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;color:${fgColor};font-size:12px;">QR Code</div>`;
  }
}

/* Inline Crisp Lucide SVG Icons (zero external CDN dependency) */
const ICON_TAG = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`;
const ICON_CHEVRON_DOWN = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
const ICON_LEAF = (cls = 'w-2.5 h-2.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
const ICON_AWARD = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>`;
const ICON_WIFI = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>`;
const ICON_UTENSILS = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
const ICON_CREDIT_CARD = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
const ICON_FLAME = (cls = 'w-2.5 h-2.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
const ICON_RADIO = (cls = 'w-2.5 h-2.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>`;
const ICON_CPU = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`;
const ICON_SHIELD_CHECK = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
const ICON_BUILDING = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
const ICON_EYE = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_MAP_PIN = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_BED = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
const ICON_BATH = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4 8 6"/><path d="M17 19v2"/><path d="M2 12h20"/><path d="M7 19v2"/><path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/></svg>`;
const ICON_MAXIMIZE = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;
const ICON_WAVES = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
const ICON_PHONE = (cls = 'w-2 h-2') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const ICON_SMARTPHONE = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
const ICON_CHECK_CIRCLE = (cls = 'w-3 h-3') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
const ICON_QRCODE = (cls = 'w-3.5 h-3.5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>`;
const ICON_STAR = (color: string, cls = 'w-4 h-4') => `<svg class="${cls}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const ICON_INSTAGRAM = (cls = 'w-8 h-8') => `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.1 1.45a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/></svg>`;
const ICON_GOOGLE_G = () => `<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;

function getSocialIconSvg(platform: string): string {
  switch (platform) {
    case 'spotify':
      return `<svg class="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.348-1.435-5.304-1.76-8.785-.964-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.871 7.077-.496 9.713 1.115.293.18.386.563.206.857zm1.224-2.724c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.62-.149-.493.129-1.016.621-1.166 3.532-1.073 9.404-.865 13.115 1.338.445.264.59.838.327 1.282-.264.443-.839.59-1.281.321z"/></svg>`;
    case 'instagram':
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.1 1.45a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/></svg>`;
    case 'youtube':
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    case 'tiktok':
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z"/></svg>`;
    case 'twitter':
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
    case 'linkedin':
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>`;
    case 'whatsapp':
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c.01-4.54 3.7-8.23 8.25-8.23Z"/></svg>`;
    default:
      return `<svg class="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
  }
}

export function buildCanvasHtml(
  canvasId: CanvasTemplateId,
  config: CanvasConfig,
  styles: QRStyles,
  qrContent: string
): string {
  const fgColor = styles.fgColor || '#000000';
  const showLogo = config.showCenterLogo !== false;
  const ASSETS = TEMPLATE_BASE64_ASSETS;
  const logoFor = (color: string) => (showLogo ? getGetAiPilotLogoSvgDataUrl(color) : undefined);

  let templateHtml = '';

  switch (canvasId) {
    /* ═══════════════════════════════════════════════════════════════════════
       1. BOLD RETAIL PRODUCT PROMO (Exact 1:1 with BoldRetailPromoCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'bold-retail-promo': {
      const c = config.boldRetailPromo || ({} as any);
      const theme = c.theme || 'forest-gold';
      const themeMap: Record<string, any> = {
        'navy-coral': { cardBg: 'bg-[#0a192f]', qrBadgeBg: 'bg-[#061121]', hatch: '#ff6b6b', sub: 'text-blue-100/90', accent: 'text-[#ff6b6b]', iconBg: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]', qrColor: '#0a192f' },
        'crimson-amber': { cardBg: 'bg-[#380b0b]', qrBadgeBg: 'bg-[#240505]', hatch: '#f59e0b', sub: 'text-amber-100/90', accent: 'text-[#f59e0b]', iconBg: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]', qrColor: '#380b0b' },
        'obsidian-lime': { cardBg: 'bg-[#09090b]', qrBadgeBg: 'bg-[#18181b]', hatch: '#a3e635', sub: 'text-zinc-200/90', accent: 'text-[#a3e635]', iconBg: 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]', qrColor: '#09090b' },
        'forest-gold': { cardBg: 'bg-[#0e372b]', qrBadgeBg: 'bg-[#09271e]', hatch: '#d4c33d', sub: 'text-emerald-50/90', accent: 'text-[#d4c33d]', iconBg: 'bg-[#d4c33d]/20 text-[#d4c33d] border-[#d4c33d]', qrColor: '#0e372b' },
      };
      const t = themeMap[theme] || themeMap['forest-gold'];
      const qrSvg = createAnimatedQrSvg(qrContent, 146, t.qrColor, '#ffffff', logoFor(t.qrColor));

      templateHtml = `
        <div class="relative w-[332px] rounded-[24px] border border-black/20 p-6 flex flex-col items-center justify-between text-center overflow-hidden shadow-2xl ${t.cardBg}">
          <svg width="0" height="0" class="absolute">
            <defs>
              <pattern id="diagonal-hatch-${theme}" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="${t.hatch}" stroke-width="3.8" />
              </pattern>
            </defs>
          </svg>

          <div class="space-y-1 z-10 w-full mb-3">
            <h2 class="text-[32px] font-black tracking-tighter uppercase leading-none text-white" style="font-family:'Impact','Arial Black',sans-serif;">
              ${escapeHtml(c.headline || 'SCAN HERE')}
            </h2>
            <p class="text-[10px] font-bold tracking-[0.16em] uppercase ${t.sub}">
              ${escapeHtml(c.subheadline || 'TO SEE OUR BEST PRODUCTS')}
            </p>
          </div>

          <div class="relative my-4 flex items-center justify-center w-full z-10">
            <div class="absolute -top-6 -right-3 w-28 h-28 pointer-events-none z-0 animate-pulse" style="animation-duration:4s;">
              <svg width="112" height="112" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="url(#diagonal-hatch-${theme})" />
              </svg>
            </div>
            <div class="absolute -bottom-6 -left-3 w-28 h-28 pointer-events-none z-0 animate-pulse" style="animation-duration:4s;">
              <svg width="112" height="112" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="url(#diagonal-hatch-${theme})" />
              </svg>
            </div>

            <div class="relative z-10 p-4 rounded-[24px] border-[2.5px] border-white shadow-2xl ${t.qrBadgeBg}">
              <div class="p-2.5 rounded-[16px] bg-white shadow-inner flex items-center justify-center">
                ${qrSvg}
              </div>
            </div>
          </div>

          <div class="w-full mt-4 pt-3 flex items-center justify-between text-left z-10">
            <div class="max-w-[170px] flex items-center gap-1.5">
              <div class="p-1 rounded-md bg-white/10 shrink-0 ${t.accent} animate-icon-wiggle">
                ${ICON_TAG('w-3.5 h-3.5')}
              </div>
              <h3 class="text-[14px] font-black uppercase tracking-tight leading-[1.1] text-white" style="font-family:'Impact','Arial Black',sans-serif;">
                ${escapeHtml(c.discountText || 'GET DISCOUNT UP TO 50% OFF!')}
              </h3>
            </div>

            <div class="flex flex-col items-end space-y-1">
              <div class="flex items-center gap-1.5 w-full justify-end">
                <div class="h-[1.5px] w-12 bg-white/40"></div>
                <div class="relative w-6 h-6 rounded-full border flex items-center justify-center ${t.iconBg} shadow-sm">
                  <span class="absolute inset-0 rounded-full bg-current opacity-25 animate-ping" style="animation-duration:2.2s;"></span>
                  ${ICON_CHEVRON_DOWN('w-3.5 h-3.5 animate-icon-bounce relative z-10')}
                </div>
              </div>
              <span class="text-[9.5px] font-bold tracking-wide ${t.sub}">
                ${escapeHtml(c.websiteUrl || 'www.getaipilot.in')}
              </span>
            </div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       2. CURVED WAVE DIGITAL E-MENU (Exact 1:1 with CurvedWaveMenuCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'curved-wave-menu': {
      const c = config.curvedWaveMenu || ({} as any);
      const theme = c.theme || 'teal-ocean';
      const themeMap: Record<string, any> = {
        'indigo-night': { canopy: 'bg-[#1e295d]', accent: 'text-[#1e295d]', border: 'border-[#1e295d]/40', qrColor: '#1e295d' },
        'terracotta-warm': { canopy: 'bg-[#c25e36]', accent: 'text-[#c25e36]', border: 'border-[#c25e36]/40', qrColor: '#c25e36' },
        'emerald-deep': { canopy: 'bg-[#0f6848]', accent: 'text-[#0f6848]', border: 'border-[#0f6848]/40', qrColor: '#0f6848' },
        'teal-ocean': { canopy: 'bg-[#148a9d]', accent: 'text-[#148a9d]', border: 'border-[#148a9d]/40', qrColor: '#148a9d' },
      };
      const t = themeMap[theme] || themeMap['teal-ocean'];
      const qrSvg = createAnimatedQrSvg(qrContent, 150, t.qrColor, '#ffffff', logoFor(t.qrColor));
      const logoParts = (c.logoText || 'YOUR LOGO').trim().split(' ');
      const logoWord1 = logoParts[0] || 'YOUR';
      const logoWord2 = logoParts.slice(1).join(' ') || 'LOGO';

      templateHtml = `
        <div class="relative w-[332px] rounded-[24px] border border-slate-200/90 bg-white flex flex-col items-center text-center overflow-hidden shadow-2xl">
          <div class="w-full pt-8 pb-12 px-6 flex flex-col items-center relative z-10 ${t.canopy}">
            <h2 class="text-[34px] font-black tracking-wider uppercase text-white leading-tight font-montserrat">
              ${escapeHtml(c.menuTitle || 'E-MENU')}
            </h2>
            <p class="text-[11px] font-medium text-white/95 mt-1 max-w-[240px]">
              ${escapeHtml(c.menuSubtitle || 'For a contactless menu, scan QR code')}
            </p>
            <div class="mt-5 p-4 rounded-[18px] bg-white shadow-xl flex items-center justify-center">
              ${qrSvg}
            </div>
          </div>

          <div class="-mt-7 w-full overflow-hidden leading-none z-10">
            <svg viewBox="0 0 500 60" preserveAspectRatio="none" class="w-full h-8 block">
              <path d="M 0 0 C 150 55, 350 55, 500 0 L 500 60 L 0 60 Z" fill="#ffffff" />
            </svg>
          </div>

          <div class="w-full pb-7 pt-1 px-6 flex flex-col items-center bg-white z-20">
            <div class="w-14 h-14 rounded-lg border-2 border-dashed ${t.border} flex flex-col items-center justify-center p-1 mb-3 bg-slate-50/50 shadow-xs animate-icon-float overflow-hidden">
              ${config.logoUrl
                ? `<img src="${escapeHtml(config.logoUrl)}" alt="Brand Logo" class="w-full h-full object-contain" />`
                : `<div class="flex flex-col items-center justify-center leading-none">
                     <span class="text-[7.5px] font-black tracking-wider text-slate-700 uppercase">${escapeHtml(logoWord1)}</span>
                     <span class="text-[8px] font-black tracking-wider text-slate-800 uppercase mt-0.5">${escapeHtml(logoWord2)}</span>
                   </div>`}
            </div>
            <h3 class="text-[15px] font-black uppercase tracking-wide ${t.accent}">
              ${escapeHtml(c.descriptionTitle || 'QR MENU DESCRIPTION')}
            </h3>
            <p class="text-[10.5px] font-medium text-slate-600 mt-1 max-w-[270px] leading-relaxed">
              ${escapeHtml(c.descriptionText || 'More comfortable, faster and environmentally friendly.')}
            </p>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       3. BOTANICAL APOTHECARY & SPA (Exact 1:1 with BotanicalApothecaryCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'botanical-apothecary': {
      const c = config.botanicalApothecary || ({} as any);
      const theme = c.theme || 'emerald-sage';
      const themeMap: Record<string, any> = {
        'vintage-amber': { cardBg: 'bg-gradient-to-b from-[#2e1908] via-[#1f1004] to-[#120802]', border: 'border-[#b48246]', inlay: 'border-[#d8a765]/40', accent: 'text-[#f3caa1]', goldText: 'text-[#fae4c3]', subText: 'text-[#d6b492]', stem: '#d8a765', wax: 'bg-[#7c3a10] border-[#d8a765] text-[#fae4c3]', pill: 'bg-[#180a02]/80 border-[#b48246]/40 text-[#fae4c3]', qrBorder: 'border-[#b48246] bg-[#fffcf7]', qrColor: '#221104', marble: 'from-[#d4b996] via-[#f5e6d3] to-[#bba07d]', baseBorder: 'border-[#8d693a]' },
        'rose-quartz': { cardBg: 'bg-gradient-to-b from-[#2e1420] via-[#1f0b14] to-[#11050a]', border: 'border-[#d48b9f]', inlay: 'border-[#f2aebd]/40', accent: 'text-[#fed7e2]', goldText: 'text-[#ffe4ec]', subText: 'text-[#e2a9b8]', stem: '#f2aebd', wax: 'bg-[#831843] border-[#f2aebd] text-[#ffe4ec]', pill: 'bg-[#18070e]/80 border-[#d48b9f]/40 text-[#ffe4ec]', qrBorder: 'border-[#d48b9f] bg-[#fffafd]', qrColor: '#290918', marble: 'from-[#e2cfd5] via-[#f7edf1] to-[#c9b2ba]', baseBorder: 'border-[#9d6374]' },
        'midnight-apothecary': { cardBg: 'bg-gradient-to-b from-[#151c19] via-[#0d1210] to-[#050806]', border: 'border-[#c5a059]', inlay: 'border-[#c5a059]/40', accent: 'text-[#f5ecd5]', goldText: 'text-[#ffffff]', subText: 'text-[#a4b5aa]', stem: '#c5a059', wax: 'bg-[#1a2e22] border-[#c5a059] text-[#fae4c3]', pill: 'bg-[#080d0a]/80 border-[#c5a059]/40 text-[#f5ecd5]', qrBorder: 'border-[#c5a059] bg-[#ffffff]', qrColor: '#0f1612', marble: 'from-[#8a948e] via-[#cbd5cf] to-[#717b75]', baseBorder: 'border-[#525b55]' },
        'emerald-sage': { cardBg: 'bg-gradient-to-b from-[#182e22] via-[#0f2017] to-[#07130c]', border: 'border-[#c9a767]', inlay: 'border-[#dfc38d]/40', accent: 'text-[#fae5be]', goldText: 'text-[#fffaf0]', subText: 'text-[#c2d7cb]', stem: '#dfc38d', wax: 'bg-[#0b3820] border-[#c9a767] text-[#fae5be]', pill: 'bg-[#06120b]/80 border-[#c9a767]/40 text-[#fae5be]', qrBorder: 'border-[#c9a767] bg-[#fbf9f4]', qrColor: '#0b2014', marble: 'from-[#c2cfc6] via-[#e5ede8] to-[#9cb0a2]', baseBorder: 'border-[#74877b]' },
      };
      const t = themeMap[theme] || themeMap['emerald-sage'];
      const qrSvg = createAnimatedQrSvg(qrContent, 144, t.qrColor, '#ffffff', logoFor(t.qrColor));

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[332px] rounded-t-[140px] rounded-b-[24px] border-2 p-5 flex flex-col items-center text-center overflow-hidden shadow-2xl ${t.cardBg} ${t.border}">
            <div class="absolute inset-2.5 rounded-t-[130px] rounded-b-[16px] border pointer-events-none ${t.inlay}"></div>

            <div class="relative mt-2 mb-2 z-10 flex flex-col items-center">
              <svg width="74" height="64" viewBox="0 0 100 86" fill="none" class="animate-icon-float drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                <path d="M 50 82 Q 52 45 50 8" stroke="${t.stem}" stroke-width="2.5" stroke-linecap="round" />
                <path d="M 50 68 C 30 65, 24 50, 36 44 C 46 48, 50 60, 50 68 Z" fill="${t.stem}" fill-opacity="0.85" stroke="${t.stem}" stroke-width="1" />
                <path d="M 50 68 Q 38 56 36 44" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />
                <path d="M 50 48 C 28 44, 22 30, 34 22 C 45 28, 49 40, 50 48 Z" fill="${t.stem}" fill-opacity="0.85" stroke="${t.stem}" stroke-width="1" />
                <path d="M 50 48 Q 37 34 34 22" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />
                <path d="M 50 28 C 34 24, 30 12, 40 6 C 47 12, 50 20, 50 28 Z" fill="${t.stem}" fill-opacity="0.9" stroke="${t.stem}" stroke-width="1" />
                <path d="M 50 58 C 70 55, 76 40, 64 34 C 54 38, 50 50, 50 58 Z" fill="${t.stem}" fill-opacity="0.85" stroke="${t.stem}" stroke-width="1" />
                <path d="M 50 58 Q 62 46 64 34" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />
                <path d="M 50 38 C 72 34, 78 20, 66 12 C 55 18, 51 30, 50 38 Z" fill="${t.stem}" fill-opacity="0.85" stroke="${t.stem}" stroke-width="1" />
                <path d="M 50 38 Q 63 24 66 12" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />
                <circle cx="50" cy="8" r="3.5" fill="${t.stem}" />
              </svg>
              <span class="text-[8.5px] font-bold tracking-[0.25em] uppercase mt-1 ${t.accent}">
                ${escapeHtml(c.batchNumber || 'BATCH NO. 84 • EST. 1928')}
              </span>
            </div>

            <div class="space-y-1 mb-2 z-10">
              <h3 class="text-[16px] font-serif-display font-black tracking-[0.18em] uppercase leading-tight ${t.goldText}">
                ${escapeHtml(c.brandName || 'ST. CLAIR BOTANICALS')}
              </h3>
              <p class="text-[10px] font-medium tracking-wider uppercase ${t.subText}">
                ${escapeHtml(c.apothecarySubtitle || 'Organic Herbal Apothecary & Holistic Spa')}
              </p>
            </div>

            <div class="relative my-1 z-10">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8.5px] font-black tracking-widest uppercase border shadow-sm ${t.wax}">
                <span class="animate-icon-wiggle">${ICON_LEAF('w-2.5 h-2.5')}</span>
                <span>${escapeHtml(c.waxSealText || '100% BOTANICAL')}</span>
              </div>
            </div>

            <div class="w-full py-1.5 px-3 rounded-xl border text-[9px] font-semibold my-2 relative z-10 text-center ${t.pill}">
              <span class="block truncate">${escapeHtml(c.ingredientsList || 'Wild French Lavender • Cold-Pressed Jojoba • Chamomile')}</span>
            </div>

            <div class="relative my-1.5 p-2 flex items-center justify-center z-10">
              <div class="p-3 rounded-2xl border-2 shadow-2xl ${t.qrBorder}">
                ${qrSvg}
              </div>
            </div>

            <div class="mt-2 space-y-0.5 w-full relative z-10">
              <p class="text-[11px] font-serif-display font-bold uppercase tracking-[0.14em] ${t.goldText}">
                ${escapeHtml(c.headline || 'SCAN FOR ELIXIR & SPA RITUAL MENU')}
              </p>
              <p class="text-[9px] font-medium leading-relaxed max-w-[270px] mx-auto ${t.subText}">
                ${escapeHtml(c.subheadline || 'Handcrafted herbal infusions, aromatherapy rituals & bespoke treatments')}
              </p>
            </div>

            <div class="mt-3 pt-2.5 border-t w-full flex items-center justify-between text-[9px] font-bold ${t.inlay} relative z-10">
              <div class="flex items-center gap-1.5">
                <span class="text-amber-400 animate-icon-bounce animate-gold-glow">${ICON_AWARD('w-3.5 h-3.5')}</span>
                <span class="${t.accent}">APOTHECARY VERIFIED</span>
              </div>
              <div class="flex items-center gap-1.5 text-[8.5px] uppercase tracking-wider text-emerald-400">
                <span class="animate-pulse">${ICON_WIFI('w-3.5 h-3.5')}</span>
                <span>GUEST WI-FI</span>
              </div>
            </div>
          </div>

          <div class="w-[190px] -mt-1 z-20 flex flex-col items-center">
            <div class="w-full h-4 rounded-md bg-gradient-to-r border shadow-xl ${t.marble} ${t.baseBorder}"></div>
            <div class="w-[160px] h-2 rounded-full bg-black/40 blur-sm -mt-0.5"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       4. FINE DINING LEATHER SOMMELIER (Exact 1:1 with LeatherSommelierCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'leather-sommelier': {
      const c = config.leatherSommelier || ({} as any);
      const theme = c.theme || 'saddle-cognac';
      const themeMap: Record<string, any> = {
        'midnight-noir': { bg: 'bg-gradient-to-b from-[#18181b] via-[#101013] to-[#070709]', border: 'border-[#d4af37]/60', stitch: 'border-zinc-500/50', title: 'text-white', gold: 'text-[#fae6a3]', sub: 'text-zinc-300', badge: 'bg-[#27272a] text-[#fae6a3] border-[#d4af37]/50', pill: 'bg-black/60 border-[#d4af37]/30 text-zinc-100', qrBorder: 'border-[#d4af37] bg-white', qrColor: '#121214', base: 'from-[#1c1917] via-[#292524] to-[#0c0a09]', baseBorder: 'border-[#d4af37]/40' },
        'bordeaux-burgundy': { bg: 'bg-gradient-to-b from-[#330f19] via-[#22070e] to-[#120206]', border: 'border-[#e0a96d]/60', stitch: 'border-[#f43f5e]/40', title: 'text-[#fff5f5]', gold: 'text-[#f7d8b5]', sub: 'text-[#fecdd3]', badge: 'bg-[#4c0519] text-[#f7d8b5] border-[#e0a96d]/50', pill: 'bg-[#180308]/80 border-[#e0a96d]/30 text-[#ffe4e6]', qrBorder: 'border-[#e0a96d] bg-[#fffaf8]', qrColor: '#2b040e', base: 'from-[#2e0912] via-[#4a0d1d] to-[#190308]', baseBorder: 'border-[#e0a96d]/40' },
        'forest-hunter': { bg: 'bg-gradient-to-b from-[#102418] via-[#09170f] to-[#040c07]', border: 'border-[#c9a767]/60', stitch: 'border-[#86efac]/40', title: 'text-white', gold: 'text-[#f5e2b8]', sub: 'text-[#bbf7d0]', badge: 'bg-[#064e3b] text-[#f5e2b8] border-[#c9a767]/50', pill: 'bg-[#040f07]/80 border-[#c9a767]/30 text-[#dcfce7]', qrBorder: 'border-[#c9a767] bg-[#fbfdfa]', qrColor: '#05160d', base: 'from-[#0d281a] via-[#163e2a] to-[#071910]', baseBorder: 'border-[#c9a767]/40' },
        'saddle-cognac': { bg: 'bg-gradient-to-b from-[#3a1d0d] via-[#261105] to-[#150702]', border: 'border-[#c29b38]/70', stitch: 'border-[#ebd28b]/50', title: 'text-[#fff8f0]', gold: 'text-[#fae6a3]', sub: 'text-[#e8d2be]', badge: 'bg-[#4a220c] text-[#fae6a3] border-[#c29b38]/60', pill: 'bg-[#180802]/80 border-[#c29b38]/30 text-[#fae6a3]', qrBorder: 'border-[#c29b38] bg-[#fffbf7]', qrColor: '#240e04', base: 'from-[#2b160a] via-[#42220f] to-[#160a03]', baseBorder: 'border-[#c29b38]/40' },
      };
      const t = themeMap[theme] || themeMap['saddle-cognac'];
      const qrSvg = createAnimatedQrSvg(qrContent, 140, t.qrColor, '#ffffff', logoFor(t.qrColor));

      const cornerSvg = `
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M 0 44 L 0 22 C 0 9.85, 9.85 0, 22 0 L 44 0 L 44 14 C 31 15, 23 23, 14 31 L 14 44 Z" fill="url(#cb-${theme})" stroke="#5c3807" stroke-width="0.8" />
          <path d="M 42 12 C 30 13, 22 21, 13 30 L 13 42" stroke="#fae6a3" stroke-width="0.75" stroke-opacity="0.7" fill="none" />
          <circle cx="15" cy="15" r="3.2" fill="#3f2705" />
          <circle cx="15" cy="15" r="2.7" fill="#d4af37" />
          <line x1="13.2" y1="15" x2="16.8" y2="15" stroke="#3f2705" stroke-width="0.7" />
        </svg>`;

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[332px] rounded-[24px] border-2 p-5 flex flex-col items-center text-center overflow-hidden shadow-2xl ${t.bg} ${t.border}">
            <svg width="0" height="0" class="absolute">
              <defs>
                <linearGradient id="cb-${theme}" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#fae6a3"/><stop offset="35%" stop-color="#d4af37"/><stop offset="70%" stop-color="#8a6818"/><stop offset="100%" stop-color="#664606"/>
                </linearGradient>
                <linearGradient id="bg-${theme}" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#0b0305"/><stop offset="30%" stop-color="#2e0b16"/><stop offset="100%" stop-color="#080204"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-3 rounded-[16px] border-2 border-dashed pointer-events-none ${t.stitch}"></div>
            <div class="absolute top-0 left-0 w-11 h-11 pointer-events-none z-20">${cornerSvg}</div>
            <div class="absolute top-0 right-0 w-11 h-11 pointer-events-none z-20" style="transform:scaleX(-1);">${cornerSvg}</div>
            <div class="absolute bottom-0 left-0 w-11 h-11 pointer-events-none z-20" style="transform:scaleY(-1);">${cornerSvg}</div>
            <div class="absolute bottom-0 right-0 w-11 h-11 pointer-events-none z-20" style="transform:scale(-1,-1);">${cornerSvg}</div>

            <div class="relative mt-1 mb-1.5 z-10 flex items-center justify-center">
              <svg width="78" height="74" viewBox="0 0 100 96" fill="none" class="animate-icon-float drop-shadow-md">
                <ellipse cx="40" cy="94" rx="14" ry="2" fill="#000" opacity="0.4" />
                <ellipse cx="76" cy="94" rx="10" ry="1.5" fill="#000" opacity="0.3" />
                <path d="M 36 26 L 36 34 C 36 42, 28 46, 28 54 L 28 90 C 28 93, 30 94, 33 94 L 47 94 C 50 94, 52 93, 52 90 L 52 54 C 52 46, 44 42, 44 34 L 44 26 Z" fill="url(#bg-${theme})" stroke="#c29b38" stroke-width="0.7" />
                <path d="M 30 52 C 30 46, 35 40, 37 34 L 37 18" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.38" />
                <path d="M 36 6 L 44 6 L 44 26 C 44 27, 36 27, 36 26 Z" fill="url(#cb-${theme})" />
                <rect x="31" y="52" width="18" height="30" rx="1.5" fill="#fffbf2" stroke="#b45309" stroke-width="0.6" />
                <circle cx="40" cy="59" r="2.5" fill="#ca8a04" />
                <text x="40" y="68" fill="#1c1917" font-family="Georgia,serif" font-size="3" font-weight="900" text-anchor="middle">RESERVE</text>
                <text x="40" y="72" fill="#78350f" font-family="Georgia,serif" font-size="2.5" font-weight="700" text-anchor="middle">2018</text>
                <g transform="translate(76, 52)">
                  <ellipse cx="0" cy="42" rx="9" ry="2" fill="none" stroke="#fae6a3" stroke-width="0.8" />
                  <line x1="0" y1="24" x2="0" y2="42" stroke="#fae6a3" stroke-width="1.2" />
                  <path d="M -9 4 C -9 20, 9 20, 9 4 Z" fill="none" stroke="#fae6a3" stroke-width="0.9" />
                  <path d="M -8 8 C -8 18, 8 18, 8 8 Z" fill="#991b1b" stroke="#f43f5e" stroke-width="0.5" />
                  <ellipse cx="0" cy="8" rx="8" ry="1.8" fill="#b91c1c" />
                </g>
              </svg>
            </div>

            <span class="text-[8.5px] font-bold tracking-[0.2em] uppercase ${t.gold}">
              ${escapeHtml(c.tableNumber || 'TABLE 14 • SOMMELIER SERVICE')}
            </span>

            <div class="space-y-0.5 my-1 z-10">
              <h3 class="text-[17px] font-serif-display font-black tracking-[0.14em] uppercase leading-tight ${t.title}">
                ${escapeHtml(c.restaurantName || 'LE CELLIER VINTAGE')}
              </h3>
              <p class="text-[9.5px] font-medium tracking-wider uppercase ${t.sub}">
                ${escapeHtml(c.sommelierTitle || 'GRAND CRU WINE & TASTING ROOM')}
              </p>
            </div>

            <div class="w-full flex items-center justify-center my-1 z-10">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8.5px] font-black tracking-widest uppercase border shadow-sm ${t.badge}">
                ${ICON_AWARD('w-2.5 h-2.5')}
                <span>${escapeHtml(c.vintageRating || '96 PTS // CELLAR SELECTION')}</span>
              </div>
            </div>

            <div class="w-full grid grid-cols-3 gap-1 py-1 px-2.5 rounded-lg bg-black/40 border border-[#c29b38]/30 text-[8px] font-mono text-center my-1 z-10">
              <div><span class="text-zinc-400 block text-[6.8px] uppercase">VINTAGE</span><span class="font-bold ${t.gold}">2018</span></div>
              <div class="border-x border-[#c29b38]/20"><span class="text-zinc-400 block text-[6.8px] uppercase">VARIETAL</span><span class="font-bold ${t.gold}">CABERNET</span></div>
              <div><span class="text-zinc-400 block text-[6.8px] uppercase">CELLAR</span><span class="font-bold text-amber-300">EST. RESERVE</span></div>
            </div>

            <div class="w-full py-1.5 px-3 rounded-xl border text-[9px] font-semibold my-1 relative z-10 text-center ${t.pill}">
              <span class="block truncate">${escapeHtml(c.pairingNote || 'Oak Barrel Reserve • Aged 24 Months in French Allier')}</span>
            </div>

            <div class="relative my-1.5 p-2 flex items-center justify-center z-10">
              <div class="absolute top-0.5 left-0.5 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]"></div>
              <div class="absolute top-0.5 right-0.5 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]"></div>
              <div class="absolute bottom-0.5 left-0.5 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]"></div>
              <div class="absolute bottom-0.5 right-0.5 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]"></div>
              <div class="p-3 rounded-2xl border-2 shadow-2xl ${t.qrBorder}">${qrSvg}</div>
            </div>

            <div class="mt-2 space-y-0.5 w-full relative z-10">
              <p class="text-[11px] font-serif-display font-bold uppercase tracking-[0.12em] ${t.gold}">
                ${escapeHtml(c.headline || 'SCAN FOR SOMMELIER RESERVE WINE LIST')}
              </p>
              <p class="text-[9px] font-medium leading-relaxed max-w-[270px] mx-auto ${t.sub}">
                ${escapeHtml(c.subheadline || 'Curated vintage cellar reserve, artisanal pairings & table-side bill pay')}
              </p>
            </div>

            <div class="mt-3 pt-2.5 border-t border-dashed w-full flex items-center justify-between text-[9px] font-bold ${t.stitch} relative z-10">
              <div class="flex items-center gap-1"><span class="text-amber-500">${ICON_UTENSILS('w-3.5 h-3.5')}</span><span class="${t.gold}">TABLE-SIDE SERVICE</span></div>
              <div class="flex items-center gap-1 text-[8.5px] uppercase tracking-wider text-emerald-400">${ICON_CREDIT_CARD('w-3 h-3')}<span>CONTACTLESS PAY</span></div>
            </div>
          </div>

          <div class="w-[180px] -mt-1 z-20 flex flex-col items-center">
            <div class="w-full h-4 rounded-md bg-gradient-to-r border shadow-xl flex items-center justify-between px-6 ${t.base} ${t.baseBorder}">
              <div class="w-2 h-2 rounded-full bg-gradient-to-b from-[#fae6a3] to-[#8a6818] border border-amber-900/60"></div>
              <div class="w-2 h-2 rounded-full bg-gradient-to-b from-[#fae6a3] to-[#8a6818] border border-amber-900/60"></div>
            </div>
            <div class="w-[150px] h-2 rounded-full bg-black/40 blur-sm -mt-0.5"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       5. ARTISAN COFFEE ROASTERS & CAFE (Exact 1:1 with CoffeeRoasterCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'coffee-roaster': {
      const c = config.coffeeRoaster || ({} as any);
      const theme = c.theme || 'nordic-oak';
      const themeMap: Record<string, any> = {
        'walnut-espresso': { bg: 'bg-gradient-to-b from-[#2b1d14] via-[#1e130c] to-[#120905]', border: 'border-[#8d6748]', inner: 'border-[#8d6748]/50', clamp: 'from-[#c29b38] via-[#ebd28b] to-[#7c5b16]', title: 'text-[#fff8f0]', sub: 'text-[#d6beaa]', cup: '#f7efe6', cupB: '#8d6748', foam: '#e6d5c3', latte: '#53341b', badge: 'bg-[#452818] text-[#fef5ec] border-[#8d6748]', notes: 'bg-[#180e08]/80 border-[#8d6748]/40 text-[#f7efe6]', chipText: 'text-[#fde68a]', qrBorder: 'border-[#8d6748] bg-[#fffbf7]', qrColor: '#22130a', foot: 'from-[#1c120a] via-[#3a2214] to-[#120904]' },
        'terracotta-clay': { bg: 'bg-gradient-to-b from-[#3a2016] via-[#2a140c] to-[#180904]', border: 'border-[#b85e3b]', inner: 'border-[#b85e3b]/40', clamp: 'from-[#b85e3b] via-[#e8906c] to-[#7a3217]', title: 'text-[#fed7aa]', sub: 'text-[#fcd34d]/80', cup: '#e07a5f', cupB: '#f4a261', foam: '#fdf0d5', latte: '#78350f', badge: 'bg-[#7a3217] text-[#ffedd5] border-[#b85e3b]', notes: 'bg-[#251007]/80 border-[#b85e3b]/30 text-[#ffedd5]', chipText: 'text-[#fed7aa]', qrBorder: 'border-[#b85e3b] bg-[#fffaf5]', qrColor: '#2a140c', foot: 'from-[#220d06] via-[#4d2214] to-[#1b0803]' },
        'matte-obsidian': { bg: 'bg-gradient-to-b from-[#18181b] via-[#101012] to-[#070709]', border: 'border-amber-400/40', inner: 'border-amber-400/30', clamp: 'from-[#c29b38] via-[#fae6a3] to-[#806019]', title: 'text-white', sub: 'text-amber-100/70', cup: '#27272a', cupB: '#d4af37', foam: '#e4d5b7', latte: '#451a03', badge: 'bg-amber-950/80 text-amber-200 border-amber-400/50', notes: 'bg-white/5 border-amber-400/20 text-amber-100', chipText: 'text-amber-200', qrBorder: 'border-amber-400/60 bg-white', qrColor: '#18181b', foot: 'from-[#111113] via-[#222226] to-[#0a0a0c]' },
        'nordic-oak': { bg: 'bg-gradient-to-b from-[#fdfcf9] via-[#f7f2ea] to-[#eee3d4]', border: 'border-[#cbb399]', inner: 'border-[#cbb399]/60 border-dashed', clamp: 'from-[#c29b38] via-[#fae6a3] to-[#7c5b16]', title: 'text-[#2b170e]', sub: 'text-[#694833]', cup: '#ffffff', cupB: '#8c6542', foam: '#dfcfbe', latte: '#5a3a22', badge: 'bg-[#7c4d29]/15 text-[#7c4d29] border-[#7c4d29]/40', notes: 'bg-white/95 border-[#cbb399]/60 text-[#3b2316]', chipText: 'text-[#4a2e1b]', qrBorder: 'border-[#cbb399] bg-white shadow-lg', qrColor: '#2b170e', foot: 'from-[#dfceba] via-[#f5ede2] to-[#dfceba]' },
      };
      const t = themeMap[theme] || themeMap['nordic-oak'];
      const qrSvg = createAnimatedQrSvg(qrContent, 138, t.qrColor, '#ffffff', logoFor(t.qrColor));
      const notes = (c.tastingNotes || 'Jasmine Blossom • Blueberry • Honeycomb • Bergamot').split('•');

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[332px] rounded-t-[160px] rounded-b-[24px] border-[3px] px-5 pb-5 pt-8 flex flex-col items-center text-center overflow-hidden shadow-2xl ${t.bg} ${t.border}">
            <div class="absolute top-0 inset-x-0 flex items-center justify-center pointer-events-none z-20">
              <div class="flex flex-col items-center">
                <div class="w-7 h-7 rounded-full border-[2.5px] border-[#c29b38] mt-[-10px]"></div>
                <div class="w-20 h-4 rounded-b-lg bg-gradient-to-b ${t.clamp} shadow-md border-x border-b border-black/30 flex items-center justify-center gap-2 mt-[-3px]">
                  <div class="w-1.5 h-1.5 rounded-full bg-black/40 border border-white/40"></div>
                  <div class="w-6 h-[1.5px] bg-black/20 rounded-full"></div>
                  <div class="w-1.5 h-1.5 rounded-full bg-black/40 border border-white/40"></div>
                </div>
              </div>
            </div>

            <div class="absolute inset-2.5 rounded-t-[144px] rounded-b-[16px] border ${t.inner} pointer-events-none"></div>

            <div class="mt-2 mb-1.5 relative z-10 flex flex-col items-center">
              <svg class="w-16 h-16 drop-shadow-md animate-icon-float" viewBox="0 0 70 70" fill="none">
                <g class="animate-icon-steam">
                  <path d="M28 14 C27 9, 31 7, 30 2" stroke="#b89372" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
                  <path d="M35 15 C34 9, 38 6, 37 1" stroke="#8c6542" stroke-width="1.6" stroke-linecap="round" opacity="0.85" />
                  <path d="M42 14 C41 9, 45 7, 44 2" stroke="#b89372" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
                </g>
                <ellipse cx="35" cy="58" rx="28" ry="6" fill="#1c120a" opacity="0.25" />
                <ellipse cx="35" cy="56" rx="26" ry="5" fill="${t.cup}" stroke="${t.cupB}" stroke-width="1.4" />
                <path d="M16 26 C16 48, 22 52, 35 52 C48 52, 54 48, 54 26 Z" fill="${t.cup}" stroke="${t.cupB}" stroke-width="1.6" />
                <path d="M52 30 C59 30, 60 42, 51 44" stroke="${t.cupB}" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <ellipse cx="35" cy="26" rx="19" ry="6" fill="${t.foam}" />
                <path d="M35 23 Q35 29 35 30" stroke="${t.latte}" stroke-width="1.3" stroke-linecap="round" />
                <path d="M32 24 Q35 26 38 24" stroke="${t.latte}" stroke-width="1.1" fill="none" />
                <path d="M30 26 Q35 28 40 26" stroke="${t.latte}" stroke-width="1.1" fill="none" />
                <path d="M31 28 Q35 30 39 28" stroke="${t.latte}" stroke-width="1.1" fill="none" />
                <circle cx="35" cy="22" r="1.3" fill="${t.latte}" />
              </svg>
            </div>

            <div class="mb-2 space-y-1 relative z-10">
              <h2 class="text-lg font-black tracking-widest uppercase font-serif-display ${t.title}">
                ${escapeHtml(c.shopName || 'TIMBER & BEAN ROASTERS')}
              </h2>
              <div class="flex items-center justify-center pt-0.5">
                <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${t.badge}">
                  ${ICON_FLAME('w-2.5 h-2.5')}
                  ${escapeHtml(c.coffeeBeansBadge || 'SINGLE ORIGIN • GUJI')}
                </span>
              </div>
              <p class="text-[10px] font-bold tracking-wide uppercase pt-0.5 ${t.sub}">
                ${escapeHtml(c.roastOrigin || 'ETHIOPIA GUJI • NATURAL HEIRLOOM')}
              </p>
            </div>

            <div class="w-full py-1.5 px-2.5 rounded-xl border mb-2 relative z-10 ${t.notes}">
              <div class="flex flex-wrap items-center justify-center gap-1">
                ${notes.map((n: string) => `<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 ${t.chipText} font-bold text-[8.5px] border border-amber-600/20">${escapeHtml(n.trim())}</span>`).join('')}
              </div>
            </div>

            <div class="relative my-1 p-1 flex items-center justify-center z-10">
              <div class="p-3 rounded-2xl border-2 shadow-2xl ${t.qrBorder}">${qrSvg}</div>
            </div>

            <div class="mt-2 space-y-0.5 w-full relative z-10">
              <p class="text-[11px] font-black uppercase tracking-wider ${t.title}">${escapeHtml(c.headline || 'SCAN FOR SPECIALTY BREW MENU')}</p>
              <p class="text-[9.5px] font-medium leading-relaxed max-w-[270px] mx-auto ${t.sub}">${escapeHtml(c.subheadline || 'View pour-over brew guide, seasonal single-origins & order ahead.')}</p>
            </div>

            <div class="w-full py-1 px-2.5 rounded-xl bg-black/5 border border-black/10 my-1.5 relative z-10 flex items-center justify-between">
              <span class="text-[8px] font-black uppercase tracking-wider ${t.title}">PUNCH CARD</span>
              <div class="flex items-center gap-1">
                ${[1, 2, 3, 4, 5].map(() => `<div class="w-4 h-4 rounded-full flex items-center justify-center text-[7.5px] bg-amber-600/20 border border-amber-600/40">☕</div>`).join('')}
                <div class="w-4 h-4 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-[7px] border border-amber-600">★</div>
              </div>
            </div>

            <div class="mt-1 pt-2 border-t w-full flex items-center justify-between text-[9px] font-bold ${t.inner} relative z-10">
              <div class="flex items-center gap-1.5">
                <span class="text-amber-600 animate-icon-bounce">${ICON_AWARD('w-3.5 h-3.5')}</span>
                <span class="${t.title} truncate max-w-[165px]">${escapeHtml(c.loyaltyOffer || '10th Coffee on Us')}</span>
              </div>
              <div class="flex items-center gap-1 text-[8.5px] uppercase tracking-wider text-emerald-600 shrink-0">
                <span class="animate-pulse">${ICON_WIFI('w-3 h-3')}</span>
                <span>WI-FI</span>
              </div>
            </div>
          </div>

          <div class="w-48 h-3.5 rounded-b-xl bg-gradient-to-r ${t.foot} shadow-xl border-t border-black/10 mt-[-2px] relative z-20 flex items-center justify-between px-3">
            <div class="w-1.5 h-1.5 rounded-full bg-[#c29b38] border border-black/20"></div>
            <div class="w-20 h-[1px] bg-black/10"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-[#c29b38] border border-black/20"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       6. CYBER HOLOGRAM & AR GLASS (Exact 1:1 with CyberHologramCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'cyber-hologram': {
      const c = config.cyberHologram || ({} as any);
      const theme = c.theme || 'iridescent-prism';
      const themeMap: Record<string, any> = {
        'matrix-cyan': { bg: 'bg-gradient-to-b from-[#031525] via-[#020b14] to-[#000408]', holo: '#06b6d4', light: '#67e8f9', hud: 'text-cyan-400', sub: 'text-cyan-200/70', badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50', qrBorder: 'border-cyan-400/70', qrColor: '#02121e', dock: 'from-[#082f49] via-[#0284c7] to-[#031c2d]', laser: 'bg-cyan-400' },
        'solar-flare': { bg: 'bg-gradient-to-b from-[#1c082e] via-[#10031c] to-[#050009]', holo: '#d946ef', light: '#f472b6', hud: 'text-fuchsia-400', sub: 'text-fuchsia-200/70', badge: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50', qrBorder: 'border-fuchsia-500/70', qrColor: '#170222', dock: 'from-[#4a044e] via-[#c026d3] to-[#240029]', laser: 'bg-fuchsia-400' },
        'quantum-emerald': { bg: 'bg-gradient-to-b from-[#021f14] via-[#01110a] to-[#000604]', holo: '#10b981', light: '#6ee7b7', hud: 'text-emerald-400', sub: 'text-emerald-200/70', badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-400/50', qrBorder: 'border-emerald-400/70', qrColor: '#01160d', dock: 'from-[#064e3b] via-[#059669] to-[#022c22]', laser: 'bg-emerald-400' },
        'iridescent-prism': { bg: 'bg-gradient-to-b from-[#0e101f] via-[#070913] to-[#020308]', holo: '#818cf8', light: '#38bdf8', hud: 'text-sky-400', sub: 'text-indigo-200/70', badge: 'bg-indigo-900/80 text-indigo-200 border-indigo-400/50', qrBorder: 'border-indigo-400/70', qrColor: '#090a18', dock: 'from-[#1e1b4b] via-[#4338ca] to-[#0f0c29]', laser: 'bg-sky-400' },
      };
      const t = themeMap[theme] || themeMap['iridescent-prism'];
      const qrSvg = createAnimatedQrSvg(qrContent, 142, t.qrColor, '#ffffff', logoFor(t.qrColor));

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative p-[2.5px] bg-gradient-to-b from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-[0_0_45px_rgba(6,182,212,0.4)]" style="clip-path:polygon(28px 0%, calc(100% - 28px) 0%, 100% 28px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0% calc(100% - 22px), 0% 28px);">
            <div class="relative w-[328px] p-5 flex flex-col items-center text-center overflow-hidden ${t.bg}" style="clip-path:polygon(26px 0%, calc(100% - 26px) 0%, 100% 26px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 26px);">
              <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image:linear-gradient(to right, rgba(56,189,248,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.2) 1px, transparent 1px);background-size:22px 22px;"></div>
              <div class="absolute top-2.5 left-8 text-[8px] font-mono-tech font-bold text-cyan-400/80 tracking-widest">◰ SYS.HUD // LIVE</div>
              <div class="absolute top-2.5 right-8 text-[8px] font-mono-tech font-bold text-fuchsia-400/80 tracking-widest">NODE.01 ◱</div>

              <div class="w-full flex items-center justify-between gap-2 mt-3 mb-2 px-1 relative z-10 font-mono-tech">
                <div class="flex items-center gap-1.5 text-left">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                  <span class="text-[9px] font-black uppercase tracking-widest ${t.hud}">${escapeHtml(c.systemTag || 'AR-SYNCED // LIVE')}</span>
                </div>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border ${t.badge}">
                  ${ICON_RADIO('w-2.5 h-2.5')}
                  ${escapeHtml(c.actionBadge || 'QUANTUM SECURE')}
                </span>
              </div>

              <div class="relative my-1 flex items-center justify-center z-10">
                <svg class="w-16 h-16 animate-icon-float" viewBox="0 0 80 80" fill="none">
                  <polygon points="40,8 66,35 40,62 14,35" stroke="${t.light}" stroke-width="1.6" fill="rgba(99,102,241,0.15)" />
                  <polygon points="40,8 66,35 40,38" stroke="${t.holo}" stroke-width="1.2" fill="rgba(56,189,248,0.25)" />
                  <polygon points="40,8 14,35 40,38" stroke="${t.holo}" stroke-width="1.2" fill="rgba(129,140,248,0.25)" />
                  <polygon points="40,62 66,35 40,38" stroke="${t.holo}" stroke-width="1.2" fill="rgba(99,102,241,0.3)" />
                  <polygon points="40,62 14,35 40,38" stroke="${t.holo}" stroke-width="1.2" fill="rgba(168,85,247,0.3)" />
                  <circle cx="40" cy="35" r="5" fill="#38bdf8" opacity="0.4" />
                  <circle cx="40" cy="35" r="3" fill="#ffffff" />
                  <circle cx="40" cy="35" r="28" stroke="${t.light}" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />
                  <circle cx="40" cy="35" r="34" stroke="${t.holo}" stroke-width="0.6" stroke-dasharray="8,6" opacity="0.4" />
                </svg>
              </div>

              <div class="mb-2 space-y-0.5 relative z-10 font-mono-tech">
                <h2 class="text-lg font-black tracking-widest uppercase text-white">${escapeHtml(c.projectName || 'QUANTUM // OS 2.0')}</h2>
                <p class="text-[9px] font-bold tracking-wider uppercase ${t.hud}">${escapeHtml(c.hudCoordinate || 'SYS.GRID // 47.6062° N, 122.3321° W')}</p>
              </div>

              <div class="w-full flex items-center justify-between px-3 py-1 rounded-md bg-black/40 border border-cyan-400/20 text-[8px] font-mono-tech text-cyan-300 my-1 relative z-10">
                <span>⚡ 60 FPS</span><span class="text-slate-400">|</span><span>FREQ: 5.8 GHz</span><span class="text-slate-400">|</span><span class="text-emerald-400 font-bold">SPATIAL AR</span>
              </div>

              <div class="relative my-2 p-3 flex items-center justify-center z-10">
                <div class="absolute top-0 left-0 w-5 h-5 border-t-[2.5px] border-l-[2.5px] border-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                <div class="absolute top-0 right-0 w-5 h-5 border-t-[2.5px] border-r-[2.5px] border-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                <div class="absolute bottom-0 left-0 w-5 h-5 border-b-[2.5px] border-l-[2.5px] border-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                <div class="absolute bottom-0 right-0 w-5 h-5 border-b-[2.5px] border-r-[2.5px] border-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                <div class="p-3 rounded-2xl bg-white shadow-[0_0_30px_rgba(6,182,212,0.4)] relative z-10 border-2 ${t.qrBorder}">${qrSvg}</div>
              </div>

              <div class="mt-1 space-y-0.5 w-full relative z-10">
                <h3 class="text-xs font-black uppercase tracking-wider text-white font-mono-tech">${escapeHtml(c.headline || 'SCAN TO ACCESS AR INTERFACE')}</h3>
                <p class="text-[9.5px] font-medium leading-relaxed max-w-[260px] mx-auto ${t.sub}">${escapeHtml(c.subheadline || 'Interactive 3D spatial node, developer beta dossier & keynote stream')}</p>
              </div>

              <div class="mt-3 pt-2.5 border-t border-cyan-400/20 w-full flex items-center justify-between text-[8.5px] font-mono-tech text-slate-400 relative z-10">
                <div class="flex items-center gap-1"><span class="text-cyan-400">${ICON_CPU('w-3 h-3')}</span><span class="text-cyan-200">SECURE SHARD</span></div>
                <div class="flex items-center gap-1 text-emerald-400 font-bold">${ICON_SHIELD_CHECK('w-3 h-3')}<span>VERIFIED AI NODE</span></div>
              </div>
            </div>
          </div>

          <div class="relative mt-[-2px] z-20 flex flex-col items-center">
            <div class="w-52 h-4 rounded-lg bg-gradient-to-r ${t.dock} border border-cyan-400/40 shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <div class="w-36 h-[3px] rounded-full ${t.laser}"></div>
            </div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       7. LUXURY REAL ESTATE & VILLA (Exact 1:1 with LuxuryRealEstateCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'luxury-realestate': {
      const c = config.luxuryRealEstate || ({} as any);
      const theme = c.theme || 'obsidian-gold';
      const themeMap: Record<string, any> = {
        'travertine-brass': { bg: 'bg-gradient-to-b from-[#f8f4ec] via-[#f0e9dc] to-[#e4dbc8]', border: 'border-[#bfae92]', bolt: 'from-[#d4af37] via-[#f7e7b4] to-[#aa8012]', inner: 'border-[#c5b59a]/70', title: 'text-[#241e17]', sub: 'text-[#62513f]', badge: 'bg-[#7a6449] text-[#fbf7f0] border-[#5c4932]', spec: 'bg-white/80 border-[#d3c5b0] text-[#33291d]', qrBorder: 'border-[#bfae92] bg-white', qrColor: '#221c15', stand: 'from-[#a08552] via-[#d4be88] to-[#6d5732]', iconCol: 'text-slate-800' },
        'monaco-white': { bg: 'bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#eef2f6]', border: 'border-slate-300', bolt: 'from-slate-400 via-slate-200 to-slate-500', inner: 'border-slate-200', title: 'text-slate-900', sub: 'text-slate-600', badge: 'bg-slate-900 text-white border-slate-700', spec: 'bg-white border-slate-200 text-slate-800', qrBorder: 'border-slate-300 bg-white', qrColor: '#0f172a', stand: 'from-slate-700 via-slate-900 to-slate-950', iconCol: 'text-slate-800' },
        'emerald-estate': { bg: 'bg-gradient-to-b from-[#07241a] via-[#041a13] to-[#020e0a]', border: 'border-emerald-500/40', bolt: 'from-[#e6c66e] via-[#fff0b3] to-[#aa8528]', inner: 'border-emerald-500/30', title: 'text-white', sub: 'text-emerald-100/70', badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40', spec: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200', qrBorder: 'border-emerald-500/40 bg-white', qrColor: '#043324', stand: 'from-[#9a782a] via-[#e2be68] to-[#5a4214]', iconCol: 'text-amber-400' },
        'obsidian-gold': { bg: 'bg-gradient-to-b from-[#18191c] via-[#101013] to-[#070709]', border: 'border-amber-400/40', bolt: 'from-[#dfb75c] via-[#fae6a3] to-[#997322]', inner: 'border-amber-400/30', title: 'text-white', sub: 'text-amber-100/70', badge: 'bg-amber-500/20 text-amber-200 border-amber-400/50', spec: 'bg-white/5 border-amber-400/20 text-amber-100', qrBorder: 'border-amber-400/60 bg-white', qrColor: '#111113', stand: 'from-[#aa822d] via-[#f3d077] to-[#614713]', iconCol: 'text-amber-400' },
      };
      const t = themeMap[theme] || themeMap['obsidian-gold'];
      const qrSvg = createAnimatedQrSvg(qrContent, 140, t.qrColor, '#ffffff', logoFor(t.qrColor));
      const agentInitial = (c.agentName || 'M').trim().charAt(0).toUpperCase();

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[332px] rounded-[24px] border-2 p-5 flex flex-col items-center text-center overflow-hidden shadow-2xl ${t.bg} ${t.border}">
            <div class="absolute top-3 left-3 w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.bolt} shadow-md border border-black/40"></div>
            <div class="absolute top-3 right-3 w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.bolt} shadow-md border border-black/40"></div>
            <div class="absolute bottom-3 left-3 w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.bolt} shadow-md border border-black/40"></div>
            <div class="absolute bottom-3 right-3 w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.bolt} shadow-md border border-black/40"></div>

            <div class="w-full flex items-center justify-between gap-2 mb-3 px-1 relative z-10">
              <div class="flex items-center gap-1.5 text-left min-w-0">
                <span class="${t.iconCol}">${ICON_BUILDING('w-3.5 h-3.5')}</span>
                <span class="text-[10px] font-extrabold uppercase tracking-[0.14em] truncate ${t.title}">${escapeHtml(config.brandName || 'Luxury Estates')}</span>
              </div>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-wider uppercase border shrink-0 ${t.badge}">
                ${ICON_SHIELD_CHECK('w-2.5 h-2.5')}
                ${escapeHtml(c.badgeTag || 'EXCLUSIVE LISTING')}
              </span>
            </div>

            <div class="w-full relative rounded-xl overflow-hidden border border-amber-400/20 mb-3 bg-[#0a0f18] aspect-[16/7] flex flex-col justify-end p-2.5 shadow-inner">
              <svg class="absolute inset-0 w-full h-full object-cover opacity-80" viewBox="0 0 320 140" fill="none">
                <rect width="320" height="140" fill="#0d1424" />
                <path d="M0 85 C60 70 120 75 180 65 C240 55 280 68 320 60 L320 140 L0 140 Z" fill="#060a12" />
                <rect x="45" y="45" width="130" height="42" fill="#1e293b" stroke="#f59e0b" stroke-width="0.8" />
                <rect x="55" y="52" width="40" height="28" fill="#38bdf8" opacity="0.3" />
                <rect x="100" y="52" width="65" height="28" fill="#fde047" opacity="0.25" />
                <rect x="160" y="30" width="105" height="40" fill="#0f172a" stroke="#d97706" stroke-width="0.8" />
                <rect x="175" y="38" width="80" height="25" fill="#67e8f9" opacity="0.35" />
                <rect x="35" y="95" width="250" height="28" rx="4" fill="#0284c7" opacity="0.45" />
                <ellipse cx="160" cy="108" rx="100" ry="8" fill="#38bdf8" opacity="0.3" />
              </svg>
              <div class="relative z-20 flex items-center justify-between w-full">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-black font-black text-[8.5px] uppercase shadow-md">
                  ${ICON_EYE('w-3 h-3')}<span>360° 3D TOUR</span>
                </span>
                <span class="text-[9.5px] font-black text-amber-300 drop-shadow">${escapeHtml(c.priceGuide || 'From $4,850,000')}</span>
              </div>
            </div>

            <div class="mb-2.5 space-y-0.5 relative z-10">
              <h2 class="text-base font-black tracking-[0.12em] uppercase leading-tight font-serif-display ${t.title}">${escapeHtml(c.propertyTitle || 'VILLA SERENA • RESIDENCES')}</h2>
              <div class="flex items-center justify-center gap-1 text-[10.5px] font-semibold">
                <span class="text-amber-500">${ICON_MAP_PIN('w-3 h-3')}</span>
                <span class="${t.sub}">${escapeHtml(c.propertyLocation || 'Palm Jumeirah • Dubai, UAE')}</span>
              </div>
            </div>

            <div class="grid grid-cols-4 gap-1.5 w-full mb-3 relative z-10">
              <div class="p-1.5 rounded-lg border flex flex-col items-center ${t.spec}"><span class="text-amber-500 mb-0.5">${ICON_BED()}</span><span class="text-[9px] font-bold">${escapeHtml(c.bedrooms || '5 Beds')}</span></div>
              <div class="p-1.5 rounded-lg border flex flex-col items-center ${t.spec}"><span class="text-amber-500 mb-0.5">${ICON_BATH()}</span><span class="text-[9px] font-bold">${escapeHtml(c.bathrooms || '6 Baths')}</span></div>
              <div class="p-1.5 rounded-lg border flex flex-col items-center ${t.spec}"><span class="text-amber-500 mb-0.5">${ICON_MAXIMIZE()}</span><span class="text-[9px] font-bold">${escapeHtml(c.areaSqFt || '7,850 sq ft')}</span></div>
              <div class="p-1.5 rounded-lg border flex flex-col items-center ${t.spec}"><span class="text-amber-500 mb-0.5">${ICON_WAVES()}</span><span class="text-[9px] font-bold">${escapeHtml(c.viewType || 'Beach')}</span></div>
            </div>

            <div class="relative my-1 p-2 flex items-center justify-center z-10">
              <div class="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400"></div>
              <div class="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400"></div>
              <div class="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400"></div>
              <div class="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400"></div>
              <div class="p-3 rounded-2xl border-2 shadow-2xl ${t.qrBorder}">${qrSvg}</div>
            </div>

            <div class="mt-2 space-y-1 w-full relative z-10">
              <p class="text-[11px] font-black uppercase tracking-wider text-amber-400">${escapeHtml(c.ctaHeadline || 'SCAN FOR 3D VIRTUAL TOUR')}</p>
              <p class="text-[9.5px] font-medium leading-relaxed max-w-[270px] mx-auto ${t.sub}">${escapeHtml(c.ctaSubheadline || 'View interactive architectural floorplans & private viewing booking')}</p>
            </div>

            <div class="mt-3 pt-2.5 border-t w-full flex items-center justify-between text-[10px] ${t.inner} relative z-10">
              <div class="flex items-center gap-2 text-left min-w-0">
                <div class="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-[10px] flex items-center justify-center shrink-0 border border-amber-300">${escapeHtml(agentInitial)}</div>
                <div class="min-w-0 truncate">
                  <p class="font-bold truncate text-[10px] leading-tight ${t.title}">${escapeHtml(c.agentName || 'Marcus Vance | Global Realty')}</p>
                  ${c.agentPhone ? `<p class="text-[8.5px] flex items-center gap-0.5 leading-tight ${t.sub}"><span class="text-amber-500">${ICON_PHONE()}</span>${escapeHtml(c.agentPhone)}</p>` : ''}
                </div>
              </div>
              <div class="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-amber-500 shrink-0">
                <span class="text-emerald-400">${ICON_SHIELD_CHECK('w-3 h-3')}</span><span>VERIFIED BROKER</span>
              </div>
            </div>
          </div>
          <div class="w-48 h-3.5 rounded-b-xl bg-gradient-to-r ${t.stand} shadow-[0_12px_25px_rgba(0,0,0,0.6)] border-t border-white/20 mt-[-2px] relative z-20 flex items-center justify-center">
            <div class="w-24 h-[1px] bg-white/40"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       8. NEON COCKTAIL BAR & VIP LOUNGE (Exact 1:1 with NeonCocktailCanvas.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'neon-cocktail': {
      const c = config.neonCocktail || ({} as any);
      const theme = c.theme || 'neon-amber';
      const themeMap: Record<string, any> = {
        'cyber-magenta': { bg: 'bg-gradient-to-b from-[#20051d] via-[#120211] to-[#050005]', tube: 'border-[#f43f5e] shadow-[0_0_20px_rgba(244,63,94,0.6)]', inner: 'border-[#fb7185]/80', glow: 'rgba(244,63,94,0.45)', neon: 'text-[#fb7185]', badge: 'bg-rose-600/30 text-rose-200 border-rose-500/50', qrColor: '#200216', baseGlow: 'rgba(244,63,94,0.5)', stroke: '#fb7185' },
        'electric-emerald': { bg: 'bg-gradient-to-b from-[#031e15] via-[#02120d] to-[#010805]', tube: 'border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.6)]', inner: 'border-[#34d399]/80', glow: 'rgba(16,185,129,0.45)', neon: 'text-[#34d399]', badge: 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50', qrColor: '#022115', baseGlow: 'rgba(16,185,129,0.5)', stroke: '#34d399' },
        'midnight-violet': { bg: 'bg-gradient-to-b from-[#180a2e] via-[#0d041c] to-[#040108]', tube: 'border-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.6)]', inner: 'border-[#c084fc]/80', glow: 'rgba(168,85,247,0.45)', neon: 'text-[#c084fc]', badge: 'bg-purple-600/30 text-purple-200 border-purple-500/50', qrColor: '#130324', baseGlow: 'rgba(168,85,247,0.5)', stroke: '#c084fc' },
        'neon-amber': { bg: 'bg-gradient-to-b from-[#221303] via-[#140b01] to-[#060300]', tube: 'border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.6)]', inner: 'border-[#fbbf24]/80', glow: 'rgba(245,158,11,0.45)', neon: 'text-[#fbbf24]', badge: 'bg-amber-600/30 text-amber-200 border-amber-500/50', qrColor: '#1a0b02', baseGlow: 'rgba(245,158,11,0.5)', stroke: '#fbbf24' },
      };
      const t = themeMap[theme] || themeMap['neon-amber'];
      const qrSvg = createAnimatedQrSvg(qrContent, 142, t.qrColor, '#ffffff', logoFor(t.qrColor));

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[332px] rounded-t-[140px] rounded-b-[24px] border-[3px] p-5 flex flex-col items-center text-center overflow-hidden ${t.bg} ${t.tube}">
            <div class="absolute inset-2.5 rounded-t-[128px] rounded-b-[16px] border border-dashed pointer-events-none opacity-40 ${t.inner}"></div>
            <div class="absolute -top-10 inset-x-0 h-44 rounded-full blur-3xl pointer-events-none" style="background:${t.glow};"></div>

            <div class="relative mt-6 mb-2 flex items-center justify-center z-10">
              <svg class="w-14 h-14 animate-icon-float" viewBox="0 0 64 64" fill="none">
                <path d="M14 16 L32 36 L50 16 Z" stroke="${t.stroke}" stroke-width="2.5" stroke-linejoin="round" fill="rgba(255,255,255,0.06)" />
                <line x1="32" y1="36" x2="32" y2="52" stroke="${t.stroke}" stroke-width="2.5" />
                <path d="M22 52 L42 52" stroke="${t.stroke}" stroke-width="2.5" stroke-linecap="round" />
                <line x1="20" y1="12" x2="38" y2="30" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" />
                <circle cx="28" cy="20" r="3.5" fill="#10b981" stroke="#f43f5e" stroke-width="1" />
                <circle cx="48" cy="12" r="1.5" fill="${t.stroke}" />
                <circle cx="16" cy="28" r="1.2" fill="${t.stroke}" />
              </svg>
            </div>

            <div class="mb-2 space-y-0.5 relative z-10">
              <h2 class="text-xl font-black tracking-widest uppercase text-white">${escapeHtml(c.venueName || 'THE VELVET ROOM')}</h2>
              <p class="text-[11px] font-bold tracking-wide uppercase ${t.neon}">${escapeHtml(c.venueSubtitle || 'Rooftop Cocktail Lounge & Speakeasy')}</p>
              ${c.happyHourText ? `<div class="pt-1.5"><span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${t.badge}"><span class="text-amber-300 animate-icon-wiggle">${ICON_FLAME('w-3 h-3')}</span>${escapeHtml(c.happyHourText)}</span></div>` : ''}
            </div>

            <div class="relative my-2 p-2 flex items-center justify-center z-10">
              <div class="absolute inset-0 rounded-2xl blur-xl pointer-events-none" style="background:${t.glow};"></div>
              <div class="p-3 rounded-2xl bg-white shadow-2xl relative z-10 border-2 ${t.tube}">${qrSvg}</div>
            </div>

            <div class="mt-1 space-y-1 w-full relative z-10">
              <h3 class="text-sm font-black uppercase tracking-wider text-white">${escapeHtml(c.headline || 'SCAN FOR DRINKS & TAPAS')}</h3>
              <p class="text-[10px] font-medium leading-relaxed max-w-[260px] mx-auto text-slate-300">${escapeHtml(c.subheadline || 'Order craft cocktails & bottle service directly to your table')}</p>
            </div>

            <div class="mt-3 pt-2.5 border-t border-white/10 w-full flex items-center justify-between text-[9px] font-semibold text-slate-300 relative z-10">
              <div class="flex items-center gap-1"><span class="text-emerald-400">${ICON_SMARTPHONE()}</span><span class="uppercase tracking-wider">Touchless Pay</span></div>
              <div class="flex items-center gap-1 uppercase tracking-wider"><span class="text-emerald-400">${ICON_CHECK_CIRCLE()}</span><span>GETAIPILOT</span></div>
            </div>
          </div>

          <div class="relative mt-[-4px] z-20 flex flex-col items-center">
            <div class="w-56 h-4 rounded-lg bg-gradient-to-b from-[#1c1c20] to-[#08080a] border border-white/20 shadow-2xl flex items-center justify-center">
              <div class="w-32 h-[1px] bg-white/30"></div>
            </div>
            <div class="w-48 h-3 rounded-full blur-md opacity-70 -mt-1" style="background:${t.baseGlow};"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       9. CLEAR ACRYLIC STANDEE (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'acrylic-standee': {
      const woodMap: Record<string, string> = {
        walnut: 'from-[#3e2723] via-[#4e342e] to-[#2d1b18]',
        oak: 'from-[#a07855] via-[#b88c65] to-[#8c6747]',
        birch: 'from-[#d7ccc8] via-[#e8deda] to-[#bcaaa4]',
        black: 'from-[#1a1a1a] via-[#2a2a2a] to-[#121212]',
      };
      const acrylicMap: Record<string, string> = {
        clear: 'bg-white/85 border-white/70',
        frosted: 'bg-white/95 border-white/90 backdrop-blur-md',
        smoked: 'bg-slate-900/90 text-white border-slate-700/70',
      };
      const wood = woodMap[config.acrylic.woodFinish] || woodMap.oak;
      const tone = acrylicMap[config.acrylic.acrylicTone] || acrylicMap.clear;
      const isDark = config.acrylic.acrylicTone === 'smoked';
      const qrSvg = createAnimatedQrSvg(qrContent, 160, fgColor, '#ffffff', logoFor(fgColor));

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[310px] rounded-t-[24px] rounded-b-[4px] border-2 p-6 flex flex-col items-center text-center shadow-2xl ${tone}">
            <div class="absolute inset-0 rounded-t-[22px] bg-gradient-to-tr from-transparent via-white/15 to-white/35 pointer-events-none"></div>
            <div class="relative z-10 flex flex-col items-center mb-4">
              ${config.logoUrl
                ? `<img src="${escapeHtml(config.logoUrl)}" alt="Logo" class="w-14 h-14 object-contain rounded-full border border-black/10 p-1 mb-2 bg-white" />`
                : `<div class="w-12 h-12 rounded-full border border-dashed border-slate-400 flex flex-col items-center justify-center text-[9px] font-bold text-slate-500 mb-2 leading-none"><span>YOUR</span><span>LOGO</span></div>`}
              <h3 class="text-xs font-black tracking-widest uppercase ${isDark ? 'text-white' : 'text-slate-800'}">${escapeHtml(config.brandName || 'YOUR BRAND HERE')}</h3>
            </div>
            <div class="relative z-10 p-3 bg-white rounded-2xl shadow-md border border-slate-100">${qrSvg}</div>
            <p class="relative z-10 text-[11.5px] font-medium leading-relaxed mt-4 px-2 ${isDark ? 'text-slate-200' : 'text-slate-600'}">${escapeHtml(config.acrylic.tagline || 'Scan this QR code to review our stay or service on Google')}</p>
            <div class="relative z-10 mt-3 pt-2 flex items-center justify-center gap-1.5 border-t border-black/5 w-full">
              ${ICON_GOOGLE_G()}
              <span class="text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-700'}">${escapeHtml(config.acrylic.googleRatingText || 'Google 4.9 ★★★★★')}</span>
            </div>
          </div>
          <div class="w-[344px]">
            <div class="h-7 rounded-[8px] bg-gradient-to-r ${wood} shadow-lg border border-black/20 flex items-center justify-center relative overflow-hidden">
              <div class="w-[304px] h-[3px] bg-black/40 rounded-full"></div>
              <div class="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30 pointer-events-none"></div>
            </div>
            <div class="h-3 w-[92%] mx-auto bg-black/25 blur-md rounded-full mt-[-2px]"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       10. SCENIC SOCIAL FLOATING CARD (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'social-card': {
      const bgThemes: Record<string, string> = {
        mountain: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        'gradient-purple': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #0A4737 0%, #10b981 50%, #064e3b 100%)',
      };
      const themeKey = config.socialCard.bgTheme || 'mountain';
      const bgStyle = themeKey === 'custom' && config.socialCard.customBgUrl
        ? `background-image:url('${escapeHtml(config.socialCard.customBgUrl)}');background-size:cover;background-position:center;`
        : themeKey.startsWith('gradient')
          ? `background:${bgThemes[themeKey] || bgThemes['gradient-emerald']};`
          : `background-image:url('${bgThemes[themeKey] || bgThemes.mountain}');background-size:cover;background-position:center;`;

      const qrSvg = createAnimatedQrSvg(qrContent, 135, fgColor, '#ffffff', logoFor(fgColor));
      const initials = config.brandName ? config.brandName.slice(0, 2).toUpperCase() : 'GP';

      templateHtml = `
        <div class="w-[330px] h-[470px] rounded-[32px] p-6 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden" style="${bgStyle}">
          <div class="absolute inset-0 bg-black/25 pointer-events-none"></div>
          <div class="relative z-10 w-full bg-white/95 backdrop-blur-md rounded-[26px] p-5 flex flex-col items-center text-center shadow-[0_15px_35px_rgba(0,0,0,0.2)] border border-white/80">
            <div class="w-14 h-14 rounded-full bg-[#829079] text-white flex items-center justify-center font-bold text-xs uppercase shadow-md mb-2.5 border-2 border-white overflow-hidden">
              ${config.logoUrl ? `<img src="${escapeHtml(config.logoUrl)}" alt="Avatar" class="w-full h-full object-cover" />` : escapeHtml(initials)}
            </div>
            <h3 class="text-sm font-black text-slate-900 tracking-tight leading-snug">${escapeHtml(config.brandName || 'Keystone Designs')}</h3>
            <p class="text-[11px] font-medium text-slate-500 mt-0.5 max-w-[200px] leading-tight">${escapeHtml(config.socialCard.subtitle || 'Hospitality & Dining Experience')}</p>
            <div class="my-3.5 p-2 bg-white rounded-xl border border-slate-100 shadow-xs">${qrSvg}</div>
            <div class="w-full p-1 rounded-full bg-[#829079] shadow-sm"></div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       11. HEXAGONAL DUAL COUNTER SIGN (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'hexagon-dual': {
      const metalMap: Record<string, { icon: string }> = {
        gold: { icon: 'text-[#c29b38]' },
        rosegold: { icon: 'text-[#b76e79]' },
        silver: { icon: 'text-slate-500' },
      };
      const plateMap: Record<string, string> = {
        white: 'bg-white text-slate-800',
        black: 'bg-[#18181b] text-white',
        frosted: 'bg-white/90 text-slate-800',
      };
      const isDark = config.hexagon.plateColor === 'black';
      const metal = metalMap[config.hexagon.accentMetal] || metalMap.gold;
      const plate = plateMap[config.hexagon.plateColor] || plateMap.white;
      const qrSvg = createAnimatedQrSvg(qrContent, 64, fgColor, '#ffffff', logoFor(fgColor), 0.26);

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="relative w-[320px] h-[320px] p-6 flex flex-col items-center justify-between text-center border-2 border-white/60 shadow-2xl ${plate}" style="clip-path:polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);">
            <div class="pt-4"><p class="font-serif italic text-xs tracking-wider text-pink-500 font-bold">${escapeHtml(config.brandName || 'THE BEAUTY LAB')}</p></div>
            <div class="grid grid-cols-2 gap-4 w-full px-2 items-center relative">
              <div class="flex flex-col items-center text-center space-y-1">
                <span class="${metal.icon}">${ICON_INSTAGRAM('w-8 h-8')}</span>
                <span class="text-[12px] font-black italic tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}">${escapeHtml(config.hexagon.leftTitle || 'Instagram')}</span>
                <span class="text-[10px] font-medium truncate max-w-[100px] ${isDark ? 'text-slate-300' : 'text-slate-500'}">${escapeHtml(config.hexagon.leftHandle || '@grand_vista')}</span>
              </div>
              <div class="absolute left-1/2 top-[15%] bottom-[15%] w-[2px] -translate-x-1/2 ${isDark ? 'bg-white/20' : 'bg-black/15'}"></div>
              <div class="flex flex-col items-center text-center space-y-1">
                <span class="${metal.icon}">${ICON_WIFI('w-8 h-8')}</span>
                <span class="text-[12px] font-black italic tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}">${escapeHtml(config.hexagon.rightTitle || 'Wi-Fi')}</span>
                <div class="text-[9px] leading-tight font-medium space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}">
                  <p>Network: <span class="font-bold">${escapeHtml(config.hexagon.rightSsid || 'Guest_Wifi')}</span></p>
                  <p>Pass: <span class="font-bold">${escapeHtml(config.hexagon.rightPassword || '12345678')}</span></p>
                </div>
              </div>
            </div>
            <div class="pb-3 flex flex-col items-center">
              <div class="p-1.5 bg-white rounded-lg shadow-xs border border-slate-200">${qrSvg}</div>
              <span class="text-[8px] uppercase tracking-wider font-bold text-slate-400 mt-1">Scan to Connect</span>
            </div>
          </div>
          <div class="w-[180px] h-3.5 bg-gradient-to-r from-[#dfba55] via-[#a37c22] to-[#dfba55] rounded-b-md shadow-md -mt-1"></div>
          <div class="w-[160px] h-2 bg-black/20 blur-xs rounded-full"></div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       12. TABLETOP FOLDED TENT STAND (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'tent-stand': {
      const colorMap: Record<string, { bg: string; text: string; sub: string; border: string }> = {
        cream: { bg: 'bg-[#F7EFE9]', text: 'text-[#3D312A]', sub: 'text-[#7B695E]', border: 'border-[#E5D7CD]' },
        craft: { bg: 'bg-[#DFD3C3]', text: 'text-[#3A3845]', sub: 'text-[#595567]', border: 'border-[#C7B198]' },
        slate: { bg: 'bg-[#1E293B]', text: 'text-white', sub: 'text-slate-300', border: 'border-slate-700' },
        emerald: { bg: 'bg-[#064E3B]', text: 'text-white', sub: 'text-emerald-200', border: 'border-emerald-700' },
      };
      const t = colorMap[config.tent.standColor] || colorMap.cream;
      const qrSvg = createAnimatedQrSvg(qrContent, 160, fgColor, '#ffffff', logoFor(fgColor));

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="w-[290px] rounded-t-[18px] border-t-2 border-x-2 p-6 flex flex-col items-center text-center shadow-2xl ${t.border} ${t.bg}" style="transform:perspective(800px) rotateX(8deg);transform-origin:bottom center;">
            <div class="space-y-1 mb-4">
              <h2 class="text-2xl font-black uppercase tracking-wider leading-none ${t.text}">${escapeHtml(config.tent.headline || 'SCAN')}</h2>
              <h3 class="text-xs font-bold uppercase tracking-widest ${t.sub}">${escapeHtml(config.tent.subtitle || 'QR CODE TO VIEW MENU')}</h3>
              <div class="w-12 h-1 bg-amber-600/30 rounded-full mx-auto mt-1"></div>
            </div>
            <div class="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">${qrSvg}</div>
            <div class="mt-5 space-y-1">
              <p class="text-xs font-black uppercase tracking-widest ${t.text}">${escapeHtml(config.tent.tableNumber || 'TABLE #05')}</p>
              <p class="text-[10.5px] font-medium ${t.sub}">${escapeHtml(config.tent.note || 'Browse our daily specials & order from phone')}</p>
            </div>
          </div>
          <div class="w-[300px] h-3 bg-black/30 rounded-b-md shadow-xl"></div>
          <div class="w-[260px] h-3 bg-black/20 blur-md rounded-full mt-1"></div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       13. RETAIL SCAN & PAY POSTER (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'retail-pay': {
      const themeMap: Record<string, { bg: string; ribbon: string; title: string; border: string }> = {
        pink: { bg: 'bg-gradient-to-b from-[#FFF0F5] via-[#FFE4E1] to-[#FFF0F5]', ribbon: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white', title: 'text-rose-500', border: 'border-pink-300' },
        teal: { bg: 'bg-gradient-to-b from-[#E6FFFA] via-[#B2F5EA] to-[#E6FFFA]', ribbon: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white', title: 'text-teal-700', border: 'border-teal-300' },
        amber: { bg: 'bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB]', ribbon: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white', title: 'text-amber-800', border: 'border-amber-300' },
        indigo: { bg: 'bg-gradient-to-b from-[#EEF2FF] via-[#E0E7FF] to-[#EEF2FF]', ribbon: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white', title: 'text-indigo-700', border: 'border-indigo-300' },
      };
      const t = themeMap[config.retailPay.theme] || themeMap.pink;
      const qrSvg = createAnimatedQrSvg(qrContent, 160, fgColor, '#ffffff', logoFor(fgColor));

      templateHtml = `
        <div class="flex flex-col items-center select-none">
          <div class="w-[320px] rounded-[32px] border-4 p-6 flex flex-col items-center text-center shadow-2xl ${t.border} ${t.bg}">
            <div class="mb-2">
              <div class="px-5 py-1 rounded-full ${t.ribbon} font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <span>✦</span><span>${escapeHtml(config.retailPay.ribbonText || 'SCAN & PAY')}</span><span>✦</span>
              </div>
            </div>
            <div class="space-y-0.5 mb-3">
              <h2 class="text-3xl font-black tracking-tight ${t.title}">${escapeHtml(config.retailPay.title || 'QRIS / UPI PAY')}</h2>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">${escapeHtml(config.retailPay.subtitle || 'AMAN • CEPAT • TERPERCAYA')}</p>
            </div>
            <div class="relative p-4 bg-white rounded-3xl border-2 border-slate-200/80 shadow-md">
              <div class="absolute top-2 left-2 w-4 h-4 border-t-[3px] border-l-[3px] border-red-500 rounded-tl-sm"></div>
              <div class="absolute top-2 right-2 w-4 h-4 border-t-[3px] border-r-[3px] border-red-500 rounded-tr-sm"></div>
              <div class="absolute bottom-2 left-2 w-4 h-4 border-b-[3px] border-l-[3px] border-red-500 rounded-bl-sm"></div>
              <div class="absolute bottom-2 right-2 w-4 h-4 border-b-[3px] border-r-[3px] border-red-500 rounded-br-sm"></div>
              ${qrSvg}
            </div>
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 mt-3.5">${escapeHtml(config.brandName || 'BELLA SWEET CAFE')}</h4>
            <div class="mt-3 pt-2.5 w-full border-t border-black/5 flex items-center justify-between px-2 text-[10px] text-slate-600 font-bold">
              <div class="flex items-center gap-1.5"><span class="text-emerald-600">${ICON_SHIELD_CHECK('w-4 h-4')}</span><span>${escapeHtml(config.retailPay.securityBadge || '100% Instant Verified')}</span></div>
              <span class="text-[9px] font-semibold bg-white/70 px-2 py-0.5 rounded-full border border-black/5">${escapeHtml(config.retailPay.acceptedMethods || 'All UPI / Cards')}</span>
            </div>
          </div>
          <div class="w-[310px] h-3 bg-white/90 border border-slate-200 rounded-b-xl shadow-md -mt-1"></div>
          <div class="w-[280px] h-3 bg-black/15 blur-xs rounded-full"></div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       14. PIZZERIA & GOURMET MELT (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'pizza-melt': {
      const qrFg = fgColor || '#1b4d28';
      const qrSvg = createAnimatedQrSvg(qrContent, 165, qrFg, '#fffef2', logoFor(qrFg));

      templateHtml = `
        <div class="w-[330px] rounded-[32px] p-5 shadow-2xl flex flex-col items-center text-center overflow-hidden bg-[#1b4d28] text-white border-2 border-white/10 select-none">
          <div class="mb-2 space-y-0.5 max-w-[260px]">
            <span class="text-[10px] uppercase font-bold tracking-[0.16em] text-[#faeed0] block leading-snug">${escapeHtml(config.pizzaMelt?.tagline || 'Scan to browse our artisan menu & order table-side')}</span>
            <h3 class="text-sm font-black tracking-wider text-white uppercase pt-0.5">${escapeHtml(config.brandName || 'GETAIPILOT')}</h3>
          </div>
          <div class="w-[200px] flex flex-col items-center justify-center my-1 relative">
            <div class="w-full flex items-center justify-center -mb-2 z-10 overflow-hidden rounded-t-2xl">
              <img src="${ASSETS.pizzaTop}" alt="Pizza Top" class="w-full h-auto object-cover drop-shadow-md block" />
            </div>
            <div class="w-full relative z-20 p-2.5 bg-[#fffef2] rounded-2xl shadow-xl border border-[#f5ebc6]/60 flex items-center justify-center">
              ${qrSvg}
            </div>
            <div class="w-full flex items-center justify-center -mt-2 z-10 overflow-hidden rounded-b-2xl">
              <img src="${ASSETS.pizzaBottom}" alt="Pizza Bottom" class="w-full h-auto object-cover drop-shadow-md block" />
            </div>
          </div>
          <div class="mt-2 space-y-0.5 max-w-[260px]">
            <p class="text-xs font-black tracking-widest text-[#faeed0] uppercase">${escapeHtml(config.pizzaMelt?.headline || 'WOOD-FIRED PIZZERIA')}</p>
            <span class="text-[9px] text-[#a2c4ac] block font-semibold uppercase tracking-[0.14em]">Contactless Tabletop Ordering</span>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       15. STRAWBERRY AI ART POSTER (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'strawberry-art': {
      const c = config.strawberryArt || ({} as any);
      const qrSvg = createAnimatedQrSvg(qrContent, 175, '#b72836', '#ffffff', logoFor('#b72836'));

      templateHtml = `
        <div class="w-[330px] rounded-[32px] bg-[#f8f9fb] p-6 shadow-2xl flex flex-col items-start text-left border border-slate-200/90 text-slate-800 select-none">
          <div class="space-y-1 w-full">
            <p class="text-[10px] font-black uppercase tracking-widest text-[#bf3844]">${escapeHtml(c.categoryText || 'GETAIPILOT / AI QR ART')}</p>
            <h2 class="text-2xl font-black text-[#b72836] tracking-tight leading-none">${escapeHtml(c.headline || 'QR Code Design')}</h2>
            <p class="text-xs font-medium text-slate-500 pt-0.5">${escapeHtml(c.subheadline || 'Sweet ideas. Fresh design.')}</p>
          </div>
          <div class="w-full flex justify-center my-4 relative">
            <div class="relative p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200/80">${qrSvg}</div>
          </div>
          <div class="w-full space-y-3">
            <div class="flex items-center gap-2">
              <svg class="w-7 h-7 text-[#b72836] -rotate-12 shrink-0" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 34 C 10 26, 28 28, 24 18 C 22 12, 28 10, 26 4" />
                <path d="M20 9 L 26 3 L 31 9" />
              </svg>
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fde9eb] text-[#b72836] border border-[#f8c5cb]">
                ${ICON_QRCODE('w-3.5 h-3.5')}
                <span class="text-xs font-black tracking-wide">${escapeHtml(c.buttonText || 'Scan to see more')}</span>
              </div>
            </div>
            <div class="pt-2 flex items-end justify-between w-full border-t border-slate-200/70 text-[10px]">
              <div>
                <p class="text-slate-500 font-medium">${escapeHtml(c.footerText || 'Made to catch your eye.')}</p>
                <p class="font-bold text-[#b72836]">${escapeHtml(config.brandName || 'getaipilot.in')}</p>
              </div>
              <span class="font-bold tracking-widest text-[#bf3844] uppercase">${escapeHtml(c.tagNumber || 'STRAWBERRY / 07')}</span>
            </div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       16. RETRO FLORAL CAFE POSTER (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'retro-floral': {
      const c = config.retroFloral || ({} as any);
      const qrSvg = createAnimatedQrSvg(qrContent, 160, '#2e261f', '#ffffff', logoFor('#2e261f'));

      templateHtml = `
        <div class="relative w-[330px] rounded-[32px] bg-[#fffdee] p-6 shadow-2xl flex flex-col items-center text-center border-2 border-[#eae3d2] text-[#2c2621] overflow-hidden select-none">
          <div class="w-full flex items-center justify-between px-2 mb-1 pointer-events-none opacity-80">
            <svg class="w-10 h-5" viewBox="0 0 40 20" fill="white" stroke="#2c2621" stroke-width="1.2"><path d="M6 16 A 5 5 0 0 1 12 11 A 7 7 0 0 1 24 10 A 6 6 0 0 1 35 16 Z" /></svg>
            <p class="text-[10px] uppercase font-serif tracking-[0.25em] text-[#4a3e35]">${escapeHtml(c.topBrand || 'GETAIPILOT')}</p>
            <svg class="w-10 h-5" viewBox="0 0 40 20" fill="white" stroke="#2c2621" stroke-width="1.2"><path d="M6 16 A 5 5 0 0 1 12 11 A 7 7 0 0 1 24 10 A 6 6 0 0 1 35 16 Z" /></svg>
          </div>
          <div class="my-1">
            <h2 class="text-3xl font-black text-[#2e261f] tracking-tight leading-none lowercase">scan</h2>
            <h2 class="text-3xl font-black text-[#34523c] tracking-tight leading-none lowercase">here</h2>
          </div>
          <div class="p-3 bg-white rounded-xl shadow-sm border-2 border-[#2e261f] my-2 relative z-10">${qrSvg}</div>
          <p class="text-[11px] font-black uppercase tracking-wider text-[#2e261f] my-1 relative z-10">${escapeHtml(c.subheadline || 'TO SEE OUR MENU AND PROMO')}</p>
          <div class="w-full pt-1.5 border-t border-[#e2d7c5] space-y-0.5 relative z-10 text-[10px] text-[#5e544a]">
            <h4 class="text-sm font-black text-[#34523c] tracking-tight lowercase">${escapeHtml(c.shopName || config.brandName || 'our shop')}</h4>
            <p>${escapeHtml(c.address || '123 Anywhere St., Any City')}</p>
            <p>${escapeHtml(c.phone || '+91 89822 85510')}</p>
            <p>${escapeHtml(c.email || 'hello@getaipilot.in')}</p>
          </div>
          <img src="${ASSETS.retroLeafLeft}" alt="Leaf" class="absolute bottom-0 left-0 w-16 h-auto pointer-events-none opacity-90 z-0" />
          <img src="${ASSETS.retroLeafRight}" alt="Leaf" class="absolute bottom-0 right-0 w-20 h-auto pointer-events-none opacity-90 z-0" />
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       17. 3D SOCIAL MEDIA SHOWCASE (All 8 platforms + 6 3D tokens)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'social-showcase': {
      const c = config.socialShowcase || ({} as any);
      const platform = c.platform || 'spotify';
      const platMap: Record<string, { bg: string; tok: string; brd: string; defAct: string }> = {
        spotify: { bg: 'bg-gradient-to-b from-[#3cd276] via-[#24ba60] to-[#128a42]', tok: 'bg-gradient-to-br from-[#1ed760] to-[#14833b]', brd: 'border-[#5fe695]', defAct: 'Scan the QR Code below to find me on Spotify' },
        instagram: { bg: 'bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]', tok: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]', brd: 'border-[#ff9cd2]', defAct: 'Scan the QR Code below to follow me on Instagram' },
        youtube: { bg: 'bg-gradient-to-b from-[#ff3333] via-[#d61818] to-[#990a0a]', tok: 'bg-gradient-to-br from-[#ff0000] to-[#b30000]', brd: 'border-[#ff7a7a]', defAct: 'Scan the QR Code below to subscribe on YouTube' },
        tiktok: { bg: 'bg-gradient-to-b from-[#181822] via-[#0d0d14] to-[#040408]', tok: 'bg-gradient-to-br from-[#25F4EE] to-[#FE2C55]', brd: 'border-[#25F4EE]', defAct: 'Scan the QR Code below to follow me on TikTok' },
        twitter: { bg: 'bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#09090b]', tok: 'bg-gradient-to-br from-[#3f3f46] to-[#18181b]', brd: 'border-slate-500', defAct: 'Scan the QR Code below to connect on X' },
        linkedin: { bg: 'bg-gradient-to-b from-[#0a66c2] via-[#004182] to-[#002952]', tok: 'bg-gradient-to-br from-[#0a66c2] to-[#003870]', brd: 'border-[#60a5fa]', defAct: 'Scan the QR Code below to view my LinkedIn profile' },
        whatsapp: { bg: 'bg-gradient-to-b from-[#25d366] via-[#1ea952] to-[#128c7e]', tok: 'bg-gradient-to-br from-[#25d366] to-[#128c7e]', brd: 'border-[#86efac]', defAct: 'Scan the QR Code below to chat with me on WhatsApp' },
        custom: { bg: 'bg-gradient-to-b from-[#0A4737] via-[#062c22] to-[#02140f]', tok: 'bg-gradient-to-br from-[#10b981] to-[#047857]', brd: 'border-[#6ee7b7]', defAct: 'Scan the QR Code below to visit my profile' },
      };
      const pt = platMap[platform] || platMap.spotify;
      const iconSvg = getSocialIconSvg(platform);
      const username = (c.username || 'getaipilot').replace(/^@/, '');
      const actionText = c.actionText || pt.defAct;
      const avatarUrl = c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      const qrSvg = createAnimatedQrSvg(qrContent, 160, '#000000', '#ffffff', logoFor('#000000'));

      const token = (pos: string, size: string, rot: string) =>
        `<div class="absolute rounded-full flex items-center justify-center p-2.5 border-2 ${pt.tok} ${pt.brd} ${size} ${pos} pointer-events-none" style="transform:${rot};box-shadow:inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.3), 0 16px 32px rgba(0,0,0,0.35);">${iconSvg}</div>`;

      templateHtml = `
        <div class="relative w-[332px] min-h-[460px] rounded-[36px] p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden border-2 border-white/20 ${pt.bg} select-none">
          <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(circle at center,rgba(255,255,255,0.25) 0%,transparent 70%);"></div>
          ${token('top-2 -left-6 opacity-80', 'w-16 h-16', 'rotate(-12deg) scale(1.05)')}
          ${token('top-6 -right-5 z-20', 'w-16 h-16', 'rotate(12deg) scale(1.1)')}
          ${token('top-44 -left-7 opacity-90 z-20', 'w-14 h-14', 'rotate(45deg) scale(0.95)')}
          ${token('top-52 -right-6 opacity-85 z-20', 'w-16 h-16', 'rotate(-24deg)')}
          ${token('bottom-4 -left-5 opacity-75', 'w-16 h-16', 'rotate(18deg) scale(1.1)')}
          ${token('bottom-3 -right-5 opacity-80', 'w-16 h-16', 'rotate(-12deg) scale(1.05)')}

          <div class="relative z-10 w-full bg-white rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center text-center border border-white/80 mt-6">
            <div class="relative -mt-16 mb-2">
              <div class="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-slate-100">
                <img src="${escapeHtml(avatarUrl)}" alt="Avatar" class="w-full h-full object-cover" />
              </div>
              <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white p-1.5 ${pt.tok}">${iconSvg}</div>
            </div>
            <h3 class="text-base font-black text-slate-900 tracking-tight leading-tight mt-1">@${escapeHtml(username)}</h3>
            <p class="text-[11px] text-slate-500 font-medium max-w-[220px] mt-1 leading-snug">${escapeHtml(actionText)}</p>
            <div class="mt-4 p-3 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100">${qrSvg}</div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       18. LUXURY APPAREL & DENIM FASHION (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'clothing-brand': {
      const c = config.clothingBrand || ({} as any);
      const headline = c.headline !== undefined ? c.headline : 'download GetAiPilot today';
      const subheadline = c.subheadline !== undefined ? c.subheadline : 'and enjoy exclusive savings';
      const highlightText = c.highlightText !== undefined ? c.highlightText : 'on your favourite designer brands';
      const promoBadge = c.promoBadge || '';
      const qrSvg = createAnimatedQrSvg(qrContent, 200, '#244a73', 'transparent', logoFor('#244a73'));

      templateHtml = `
        <div class="relative w-[340px] min-h-[500px] rounded-[36px] px-6 py-6 shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden border-2 border-white/80 select-none" style="background:radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f4f8f7 40%, #e2eeec 100%);">
          <div class="w-full text-right pr-2 pt-1 mb-2 space-y-0.5 z-10">
            ${headline ? `<p class="text-[14px] font-normal text-slate-800 tracking-tight leading-tight">${escapeHtml(headline)}</p>` : ''}
            ${subheadline ? `<p class="text-[13px] font-medium text-slate-800 tracking-tight leading-tight">${escapeHtml(subheadline)}</p>` : ''}
            ${highlightText ? `<p class="text-[13px] font-bold text-black tracking-tight leading-tight">${escapeHtml(highlightText)}</p>` : ''}
            ${promoBadge ? `<div class="pt-1"><span class="inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-black text-white">${escapeHtml(promoBadge)}</span></div>` : ''}
          </div>
          <div class="relative my-0 flex flex-col items-center z-10 w-full">
            <div class="w-full flex items-center justify-center -mb-[1px] z-10">
              <img src="${ASSETS.denimCollar}" alt="Collar" class="w-[258px] h-auto object-contain block" />
            </div>
            <div class="relative z-20 w-[258px] flex items-center justify-center py-1 -my-[1px]">
              ${qrSvg}
            </div>
            <div class="w-full flex items-center justify-center -mt-[1px] z-10">
              <img src="${ASSETS.denimHem}" alt="Hem" class="w-[258px] h-auto object-contain block" />
            </div>
            <div class="w-full flex items-center justify-center mt-1 z-0">
              <img src="${ASSETS.denimShadow}" alt="Shadow" class="w-[260px] h-auto object-contain block opacity-80" />
            </div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       19. DOODLE NATURE LINE-ART (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'doodle-nature': {
      const c = config.doodleNature || ({} as any);
      const showSun = c.showSun !== false;
      const qrSvg = createAnimatedQrSvg(qrContent, 175, '#1e293b', '#ffffff', logoFor('#1e293b'));

      templateHtml = `
        <div class="w-[330px] rounded-[32px] bg-[#fdfdfa] p-5 shadow-2xl flex flex-col items-center text-center border-2 border-[#e6e2d8] text-[#1c1917] overflow-hidden select-none">
          <div class="w-full flex items-start justify-between relative z-10 px-1">
            <div class="space-y-1 text-left">
              <svg class="w-12 h-6 text-slate-700" viewBox="0 0 50 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 18 C 5 18, 2 15, 4 12 C 4 9, 8 8, 11 10 C 13 6, 20 6, 22 9 C 25 8, 28 11, 28 14 C 29 18, 24 18, 20 18 Z" fill="#ffffff" />
              </svg>
              <div class="flex gap-2 pl-2 text-xs text-slate-700"><span>v</span><span class="-mt-1 font-bold">v</span></div>
            </div>
            <div class="space-y-0.5">
              <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[#1e293b]">${escapeHtml(c.headline || 'DISCOVER NATURE')}</h3>
              <p class="text-[9.5px] font-medium text-slate-500 max-w-[140px] leading-tight mx-auto">${escapeHtml(c.subheadline || 'Scan to explore paths')}</p>
            </div>
            ${showSun ? `
              <svg class="w-12 h-12 -mt-1 -mr-1" viewBox="0 0 60 60" fill="none">
                <g stroke="#ef4444" stroke-width="2" stroke-linecap="round">
                  <line x1="30" y1="4" x2="30" y2="10"/><line x1="30" y1="50" x2="30" y2="56"/><line x1="4" y1="30" x2="10" y2="30"/><line x1="50" y1="30" x2="56" y2="30"/>
                  <line x1="12" y1="12" x2="16" y2="16"/><line x1="44" y1="44" x2="48" y2="48"/><line x1="12" y1="48" x2="16" y2="44"/><line x1="44" y1="12" x2="48" y2="16"/>
                </g>
                <circle cx="30" cy="30" r="14" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
                <circle cx="26" cy="27" r="1.5" fill="#fff"/><circle cx="34" cy="27" r="1.5" fill="#fff"/>
                <path d="M26 34 Q 30 38 34 34" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                <circle cx="10" cy="20" r="2" fill="#3b82f6"/><circle cx="48" cy="4" r="2.5" fill="#10b981"/><circle cx="56" cy="24" r="1.5" fill="#eab308"/>
              </svg>
            ` : `<div class="w-10 h-10"></div>`}
          </div>

          <div class="relative my-3 p-3 bg-white rounded-2xl shadow-sm border-2 border-[#1e293b]">
            <div class="absolute -top-2 -left-2 w-6 h-6 rounded-md bg-[#10b981] border border-black flex items-center justify-center text-[10px] text-white font-bold shadow-xs">🚩</div>
            <div class="absolute -top-2 -right-2 w-6 h-6 rounded-md bg-[#ef4444] border border-black flex items-center justify-center text-[10px] text-white font-bold shadow-xs">▲</div>
            <div class="absolute -bottom-2 -left-2 w-6 h-6 rounded-md bg-[#0ea5e9] border border-black flex items-center justify-center text-[10px] text-white font-bold shadow-xs">🌊</div>
            ${qrSvg}
          </div>

          <div class="w-full relative mt-1 pt-2 border-t-2 border-[#1e293b]">
            <svg class="w-full h-10" viewBox="0 0 300 40" fill="none" stroke="#1e293b" stroke-width="1.5">
              <path d="M22 36 L 22 14 Q 22 10 26 10 Q 30 10 30 14 L 30 36" fill="#10b981" />
              <path d="M14 22 L 14 18 Q 14 16 18 16 L 22 16" fill="none" />
              <path d="M30 20 L 34 20 Q 38 20 38 18 L 38 14" fill="none" />
              <polygon points="75,36 95,12 115,36" fill="#fde047" stroke="#1e293b" stroke-width="1.5" />
              <line x1="95" y1="12" x2="95" y2="36" stroke="#ca8a04" stroke-width="1" />
              <g transform="translate(145, 14)">
                <path d="M2 18 Q 10 16 16 20 C 18 16 14 8 20 6 Q 22 4 24 6 Q 26 8 22 12 Q 26 18 20 22 L 4 22 Z" fill="#fbcfe8" stroke="#1e293b" stroke-width="1.2" />
                <circle cx="23" cy="7" r="1" fill="#1e293b" />
                <path d="M26 18 Q 32 16 38 20 C 40 16 36 8 42 6 Q 44 4 46 6 Q 48 8 44 12 Q 48 18 42 22 L 28 22 Z" fill="#fef08a" stroke="#1e293b" stroke-width="1.2" />
                <line x1="0" y1="24" x2="55" y2="24" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="3 2" />
              </g>
              <path d="M265 36 L 265 20 Q 265 16 269 16 Q 273 16 273 20 L 273 36" fill="#10b981" />
              <circle cx="288" cy="28" r="4" fill="#f43f5e" stroke="#1e293b" stroke-width="1.2" />
            </svg>
            <div class="flex items-center justify-between text-[9px] uppercase tracking-widest font-black text-slate-500 pt-1">
              <span>${escapeHtml(c.bottomTag || 'ORIGINAL ARTWORK / 01')}</span>
              <span class="text-[#ef4444] font-bold">${escapeHtml(config.brandName || 'getaipilot.in')}</span>
            </div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       20. LUXURY FLORAL REVIEW CARD (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'floral-review': {
      const c = config.floralReview || ({} as any);
      const toneMap: Record<string, { bg: string; text: string; sub: string; prompt: string }> = {
        'dove-gray': { bg: 'bg-[#d0d5d8]', text: 'text-[#1a1b1d]', sub: 'text-[#282a2d]', prompt: 'text-[#34383d]' },
        'sage-mist': { bg: 'bg-[#d5ded6]', text: 'text-[#1c221d]', sub: 'text-[#263028]', prompt: 'text-[#333f35]' },
        alabaster: { bg: 'bg-[#f5f1e8]', text: 'text-[#241e17]', sub: 'text-[#382f25]', prompt: 'text-[#4a3f33]' },
        obsidian: { bg: 'bg-[#181a1c]', text: 'text-white', sub: 'text-zinc-200', prompt: 'text-zinc-300' },
      };
      const foilMap: Record<string, { star: string; foil: string }> = {
        gold: { star: '#d4af37', foil: 'text-[#9d7d52]' },
        rosegold: { star: '#c47a7a', foil: 'text-[#a86565]' },
        'rose-gold': { star: '#c47a7a', foil: 'text-[#a86565]' },
        silver: { star: '#94a3b8', foil: 'text-[#64748b]' },
      };
      const t = toneMap[c.cardTone || 'dove-gray'] || toneMap['dove-gray'];
      const f = foilMap[c.accentFoil || 'gold'] || foilMap.gold;
      const qrSvg = createAnimatedQrSvg(qrContent, 135, '#1a1a1a', '#ffffff', logoFor('#1a1a1a'));
      const names = (c.signatureName || 'GetAiPilot Team').trim().split(' ');
      const firstName = names[0] || 'GetAiPilot';
      const lastName = names.slice(1).join(' ') || 'TEAM';
      const starsCount = c.ratingStars || 5;

      templateHtml = `
        <div class="relative w-[330px] rounded-[34px] ${t.bg} p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden select-none">
          <div class="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/5 pointer-events-none"></div>
          <div class="relative z-10 space-y-0.5 mb-2.5">
            <h2 class="text-2xl font-serif-display font-black tracking-[0.24em] uppercase ${t.text}">${escapeHtml(c.headerTitle || 'PLEASE')}</h2>
            <p class="text-lg font-serif-display italic tracking-wide -mt-0.5 ${t.sub}">${escapeHtml(c.scriptSubtitle || 'leave us a review')}</p>
          </div>
          <div class="relative z-10 my-1 flex items-center justify-center">
            <div class="relative w-[220px] h-[220px] rounded-2xl overflow-hidden shadow-lg bg-[#faf6ee]">
              <img src="${ASSETS.floralBouquet}" alt="Bouquet" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 flex items-center justify-center p-3">
                <div class="p-2 bg-white/95 rounded-xl shadow-md">${qrSvg}</div>
              </div>
            </div>
          </div>
          <div class="relative z-10 mt-3 space-y-2 max-w-[250px]">
            <p class="text-[11px] font-medium leading-snug ${t.prompt}">${escapeHtml(c.promptText || 'Please scan the QR code to review us and help spread the word!')}</p>
            <div class="flex items-center justify-center gap-1.5 pt-0.5">
              ${Array.from({ length: starsCount }).map(() => ICON_STAR(f.star, 'w-4 h-4')).join('')}
            </div>
          </div>
          <div class="relative z-10 w-full mt-2.5 pt-1 text-right pr-2">
            <p class="font-serif-display italic text-xs tracking-wider ${f.foil}">by ${escapeHtml(firstName)}</p>
            <p class="font-serif-display font-black text-sm tracking-[0.28em] uppercase -mt-0.5 ${f.foil}">${escapeHtml(lastName)}</p>
            ${c.socialHandle ? `<p class="text-[9px] font-semibold tracking-widest uppercase mt-0.5 ${f.foil} opacity-80">${escapeHtml(c.socialHandle)}</p>` : ''}
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       21. BOTANICAL BLOOM ON STEM (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'blooming-flower': {
      const c = config.bloomingFlower || ({} as any);
      const qrSvg = createAnimatedQrSvg(qrContent, 175, '#c22b1e', '#ffffff', logoFor('#c22b1e'));
      const showLadybug = c.showLadybug !== false;

      templateHtml = `
        <div class="relative w-[330px] rounded-[34px] bg-white p-6 shadow-2xl flex flex-col items-center text-center border border-slate-200/90 text-slate-800 overflow-hidden select-none">
          <div class="relative flex items-center justify-center mt-2 z-10">
            <div class="absolute -top-3 -left-3 w-16 h-16 rounded-tl-[28px] rounded-br-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>
            <div class="absolute -top-3 -right-3 w-16 h-16 rounded-tr-[28px] rounded-bl-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>
            <div class="absolute -bottom-3 -left-3 w-16 h-16 rounded-bl-[28px] rounded-tr-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>
            <div class="absolute -bottom-3 -right-3 w-16 h-16 rounded-br-[28px] rounded-tl-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>
            <div class="relative z-10 p-3 bg-white/95 rounded-2xl shadow-sm border border-[#f8c6cb]">${qrSvg}</div>
          </div>

          <div class="relative w-full flex flex-col items-center justify-center z-0">
            <div class="w-[4px] h-[90px] bg-[#4a7c59] rounded-full mx-auto relative">
              <div class="absolute bottom-4 -left-10 w-11 h-7 bg-[#74a84a] rounded-tl-3xl rounded-br-3xl border border-[#4a7c59]" style="transform:rotate(-12deg);"></div>
              <div class="absolute bottom-2 -right-11 w-12 h-8 bg-[#87b85d] rounded-tr-3xl rounded-bl-3xl border border-[#4a7c59]" style="transform:rotate(12deg);"></div>
            </div>
          </div>

          <div class="w-full flex items-center justify-between pt-2 border-t border-slate-100 relative z-10 px-2">
            <div class="flex items-center gap-2">
              ${config.logoUrl
                ? `<img src="${escapeHtml(config.logoUrl)}" alt="Logo" class="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white shrink-0" />`
                : showLadybug
                  ? `<div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#ea580c] to-[#b91c1c] border border-black flex items-center justify-center relative shrink-0">
                       <div class="w-2 h-2 rounded-full bg-black -mt-3.5"></div>
                       <div class="w-1.5 h-1.5 rounded-full bg-black absolute top-2 left-1.5"></div>
                       <div class="w-1.5 h-1.5 rounded-full bg-black absolute top-2 right-1.5"></div>
                     </div>`
                  : `<div class="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">${escapeHtml((c.brandName || config.brandName || 'G').charAt(0))}</div>`}
              <div class="text-left">
                <h4 class="text-base font-serif-display font-black tracking-tight text-[#1c1917]">${escapeHtml(c.brandName || config.brandName || 'GetAiPilot')}</h4>
                <p class="text-[8.5px] uppercase tracking-widest text-[#4a7c59] font-bold -mt-0.5">${escapeHtml(c.tagline || 'ORGANIC ESSENCE')}</p>
              </div>
            </div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scan to Bloom</span>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       22. 3D PLUSH FUZZY CHARACTER (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'plush-character': {
      const c = config.plushCharacter || ({} as any);
      const qrSvg = createAnimatedQrSvg(qrContent, 170, '#3b2210', '#fef9c3', logoFor('#3b2210'));

      templateHtml = `
        <div class="w-[330px] rounded-[34px] bg-[#fbf6ee] p-6 shadow-2xl flex flex-col items-start text-left border border-[#ede3d4] text-[#2c241e] overflow-hidden select-none">
          <div class="space-y-1 w-full">
            <p class="text-[10px] font-serif uppercase tracking-[0.25em] text-[#93785d] font-semibold">${escapeHtml(c.brandTag || 'GETAIPILOT')}</p>
            <h2 class="text-2xl font-serif-display font-normal leading-[1.08] text-[#2c241e]">${escapeHtml(c.headline || 'QR codes. With character.')}</h2>
            <p class="text-[11.5px] font-normal text-[#6f5e51] leading-relaxed pt-1 max-w-[270px]">${escapeHtml(c.subheadline || 'Turn everyday links into something memorable. Create artistic QR codes with GetAiPilot.')}</p>
          </div>
          <div class="w-full flex flex-col items-center justify-center my-4 relative">
            <div class="relative p-3.5 rounded-[28px] bg-gradient-to-b from-[#fde68a] via-[#fcd34d] to-[#fbbf24] shadow-xl border-4 border-[#fef08a] flex items-center justify-center overflow-hidden">
              <div class="relative z-10 p-2 bg-[#fef9c3] rounded-2xl shadow-inner border border-[#fef08a]">${qrSvg}</div>
            </div>
            <div class="w-[190px] h-[10px] bg-[#3b2210]/15 rounded-full blur-[4px] -mt-1"></div>
          </div>
          <div class="w-full space-y-3">
            <div class="flex items-center justify-between w-full">
              <span class="font-serif-display text-lg font-normal text-[#2c241e]">${escapeHtml(c.ctaText || 'Scan to see more.')}</span>
              <svg class="w-8 h-8 text-[#8d7055] rotate-12 shrink-0" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 32 C 14 24, 28 26, 26 14 C 24 8, 30 6, 28 2" />
                <path d="M22 6 L 28 2 L 32 8" />
              </svg>
            </div>
            <div class="pt-2 border-t border-[#ede3d4] w-full flex items-center justify-between text-[8px] uppercase tracking-widest text-[#93785d] font-bold">
              <span>${escapeHtml(c.footerTag || 'ARTISTIC QR CODES')}</span>
              <span class="text-[#3b2210] font-black">${escapeHtml(config.brandName || 'getaipilot.in')}</span>
            </div>
          </div>
        </div>
      `;
      break;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       23. CLASSIC MINIMALIST QR (Exact 1:1 with CanvasTemplates.tsx)
       ═══════════════════════════════════════════════════════════════════════ */
    case 'classic':
    default: {
      const qrSvg = createAnimatedQrSvg(qrContent, 200, fgColor, styles.bgColor || '#ffffff', logoFor(fgColor));

      templateHtml = `
        <div class="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xl flex flex-col items-center text-center select-none w-[310px]">
          ${config.brandName ? `<h4 class="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">${escapeHtml(config.brandName)}</h4>` : ''}
          <div class="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs">${qrSvg}</div>
          <p class="text-[11px] text-slate-500 font-medium mt-3">Scan with your smartphone camera</p>
        </div>
      `;
      break;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes" />
  <title>QR Standee Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700;900&family=Montserrat:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0;
      padding: 10px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      background-color: transparent;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
    .font-serif-display { font-family: 'Playfair Display', Georgia, serif; }
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-mono-tech { font-family: 'Space Grotesk', monospace; }
    .font-montserrat { font-family: 'Montserrat', sans-serif; }
    .qr-anim-container {
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    }
    .qr-center-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 6px;
      padding: 2px;
      z-index: 10;
    }
    @keyframes qrLaserPingPong {
      0% { top: 4%; opacity: 0.85; }
      50% { top: 92%; opacity: 1; }
      100% { top: 4%; opacity: 0.85; }
    }
    @keyframes iconFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3.5px); }
    }
    @keyframes iconWiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-8deg); }
      75% { transform: rotate(8deg); }
    }
    @keyframes iconBounceSoft {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes goldGlowPulse {
      0%, 100% { opacity: 0.85; }
      50% { opacity: 1; }
    }
    @keyframes iconSteam {
      0% { transform: translateY(0) scaleY(1); opacity: 0.7; }
      50% { transform: translateY(-3px) scaleY(1.1); opacity: 0.9; }
      100% { transform: translateY(-6px) scaleY(1.2); opacity: 0.3; }
    }
    .animate-qr-laser { animation: qrLaserPingPong 2.4s ease-in-out infinite; }
    .animate-icon-float { animation: iconFloat 3.2s ease-in-out infinite; }
    .animate-icon-wiggle { animation: iconWiggle 2.2s ease-in-out infinite; }
    .animate-icon-bounce { animation: iconBounceSoft 1.8s ease-in-out infinite; }
    .animate-gold-glow { animation: goldGlowPulse 2.4s ease-in-out infinite; }
    .animate-icon-steam { animation: iconSteam 2.5s ease-in-out infinite; }
  </style>
</head>
<body>
  <div id="canvas-export-root" class="w-full flex justify-center py-2">
    ${templateHtml}
  </div>

  <script>
    ${HTML2CANVAS_SOURCE}
  </script>

  <script>
    function reportHeight() {
      try {
        var root = document.getElementById('canvas-export-root');
        var h = root ? Math.ceil(root.getBoundingClientRect().height) + 28 : document.body.scrollHeight;
        if (window.ReactNativeWebView && h > 100) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CANVAS_HEIGHT', height: h }));
        }
      } catch (e) {}
    }
    window.addEventListener('load', function() {
      setTimeout(reportHeight, 120);
      setTimeout(reportHeight, 600);
    });
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(reportHeight).observe(document.body);
    }

    window.exportCanvas = function(scale) {
      scale = scale || 3;
      var target = document.getElementById('canvas-export-root');
      if (!target || typeof html2canvas !== 'function') {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_ERROR',
            error: 'Export engine is still initializing. Please try again.'
          }));
        }
        return;
      }

      html2canvas(target, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      }).then(function(canvas) {
        var dataUrl = canvas.toDataURL('image/png');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_SUCCESS',
            dataUrl: dataUrl
          }));
        }
      }).catch(function(err) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_ERROR',
            error: String(err)
          }));
        }
      });
    };
  </script>
</body>
</html>`;
}
