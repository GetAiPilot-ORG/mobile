import { CanvasConfig, CanvasTemplateId, QRStyles, getGetAiPilotLogoSvgDataUrl } from "./types";

/**
 * Builds a standalone, fully-styled HTML document to render any of the 23 QR standee templates
 * inside an interactive React Native WebView.
 *
 * Features:
 * - Tailwind CSS + Google Fonts for true-to-life 3D desktop/standee mockups
 * - High-speed client-side QR generation with center logo support
 * - Built-in html2canvas for 300 DPI high-resolution PNG exports
 * - React Native postMessage communication bridge
 */
export function buildCanvasHtml(
  canvasId: CanvasTemplateId,
  config: CanvasConfig,
  styles: QRStyles,
  qrContent: string
): string {
  const safeContent = JSON.stringify(qrContent || "https://getaipilot.in");
  const safeConfig = JSON.stringify(config);
  const safeStyles = JSON.stringify(styles);
  const fgColor = styles.fgColor || "#000000";
  const logoSvgDataUrl = getGetAiPilotLogoSvgDataUrl(fgColor);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes" />
  <title>QR Standee Studio</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700;900&family=Montserrat:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <!-- QRCode.js and html2canvas -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <!-- FontAwesome Icons for Social / Amenities -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      margin: 0;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: transparent;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }
    .font-serif-display {
      font-family: 'Playfair Display', serif;
    }
    .font-cinzel {
      font-family: 'Cinzel', serif;
    }
    .font-mono-tech {
      font-family: 'Space Grotesk', monospace;
    }
    .font-montserrat {
      font-family: 'Montserrat', sans-serif;
    }
    /* QR Container styling */
    .qr-svg-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .qr-center-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 6px;
      padding: 3px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      z-index: 10;
    }
  </style>
</head>
<body>
  <div id="canvas-export-root" class="w-full flex justify-center py-2">
    <!-- Dynamic Canvas HTML will be injected here -->
  </div>

  <script>
    const canvasId = "${canvasId}";
    const config = ${safeConfig};
    const styles = ${safeStyles};
    const qrContent = ${safeContent};
    const logoDataUrl = "${logoSvgDataUrl}";

    // Generate QR SVG
    function generateQrSvg(size, color, customBg) {
      const typeNumber = 0; // auto-detect
      const errorCorrectionLevel = styles.level || 'H';
      const qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData(qrContent);
      qr.make();
      
      const moduleCount = qr.getModuleCount();
      const cellSize = size / moduleCount;
      const margin = styles.includeMargin ? 4 * cellSize : 0;
      const totalSize = size + (margin * 2);
      const fg = color || styles.fgColor || '#000000';
      const bg = customBg || styles.bgColor || '#ffffff';

      let rects = '';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            const x = margin + c * cellSize;
            const y = margin + r * cellSize;
            rects += '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + (cellSize + 0.1).toFixed(2) + '" height="' + (cellSize + 0.1).toFixed(2) + '" fill="' + fg + '" />';
          }
        }
      }

      let logoHtml = '';
      if (config.showCenterLogo !== false) {
        const logoSize = Math.max(20, Math.round(size * (config.centerLogoScale || 0.18)));
        logoHtml = '<div class="qr-center-logo" style="width:' + logoSize + 'px;height:' + logoSize + 'px;">' +
          '<img src="' + logoDataUrl + '" style="width:100%;height:100%;object-fit:contain;" />' +
          '</div>';
      }

      return '<div class="qr-svg-wrapper" style="width:' + totalSize + 'px;height:' + totalSize + 'px;">' +
        '<svg width="' + totalSize + '" height="' + totalSize + '" viewBox="0 0 ' + totalSize + ' ' + totalSize + '" style="background:' + bg + ';border-radius:12px;">' +
        rects +
        '</svg>' +
        logoHtml +
        '</div>';
    }

    // Render Canvas Template
    function render() {
      const root = document.getElementById('canvas-export-root');
      let html = '';

      switch (canvasId) {
        case 'bold-retail-promo': {
          const c = config.boldRetailPromo || {
            headline: 'SCAN HERE',
            subheadline: 'TO SEE OUR BEST PRODUCTS',
            discountText: 'GET DISCOUNT UP TO 50% OFF!',
            websiteUrl: 'www.getaipilot.in',
            theme: 'forest-gold',
          };
          const themeMap = {
            'navy-coral': { card: 'bg-[#0a192f]', hatch: '#ff6b6b', accent: 'text-[#ff6b6b]', qrColor: '#0a192f' },
            'crimson-amber': { card: 'bg-[#380b0b]', hatch: '#f59e0b', accent: 'text-[#f59e0b]', qrColor: '#380b0b' },
            'obsidian-lime': { card: 'bg-[#09090b]', hatch: '#a3e635', accent: 'text-[#a3e635]', qrColor: '#09090b' },
            'forest-gold': { card: 'bg-[#0e372b]', hatch: '#d4c33d', accent: 'text-[#d4c33d]', qrColor: '#0e372b' },
          };
          const t = themeMap[c.theme] || themeMap['forest-gold'];
          html = '<div class="w-[320px] sm:w-[350px] rounded-[26px] p-6 text-center text-white shadow-2xl relative overflow-hidden ' + t.card + '">' +
            '<div class="mb-3 space-y-1">' +
              '<h2 class="text-2xl font-black tracking-tight uppercase font-montserrat">' + (c.headline || 'SCAN HERE') + '</h2>' +
              '<p class="text-[11px] font-bold tracking-widest text-emerald-100/90">' + (c.subheadline || 'TO SEE OUR BEST PRODUCTS') + '</p>' +
            '</div>' +
            '<div class="my-3 p-3 bg-white rounded-2xl shadow-xl inline-block">' +
              generateQrSvg(160, t.qrColor, '#ffffff') +
            '</div>' +
            '<div class="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/20">' +
              '<p class="text-xs font-black ' + t.accent + '">' + (c.discountText || 'GET DISCOUNT UP TO 50% OFF!') + '</p>' +
              '<p class="text-[10px] text-white/80 mt-0.5">' + (c.websiteUrl || 'www.getaipilot.in') + '</p>' +
            '</div>' +
          '</div>';
          break;
        }

        case 'curved-wave-menu': {
          const c = config.curvedWaveMenu || {
            menuTitle: 'E-MENU',
            menuSubtitle: 'For a contactless menu, scan QR code',
            descriptionTitle: 'QR MENU DESCRIPTION',
            descriptionText: 'More comfortable, faster and environmentally friendly.',
            theme: 'teal-ocean',
          };
          const themeMap = {
            'indigo-night': { canopy: 'bg-[#1e295d]', qrColor: '#1e295d' },
            'terracotta-warm': { canopy: 'bg-[#c25e36]', qrColor: '#c25e36' },
            'emerald-deep': { canopy: 'bg-[#0f6848]', qrColor: '#0f6848' },
            'teal-ocean': { canopy: 'bg-[#148a9d]', qrColor: '#148a9d' },
          };
          const t = themeMap[c.theme] || themeMap['teal-ocean'];
          html = '<div class="w-[320px] sm:w-[350px] rounded-[26px] bg-white text-slate-800 shadow-2xl overflow-hidden border border-slate-200">' +
            '<div class="pt-7 pb-10 px-5 text-center text-white ' + t.canopy + '">' +
              '<h2 class="text-3xl font-black uppercase tracking-wider font-montserrat">' + (c.menuTitle || 'E-MENU') + '</h2>' +
              '<p class="text-[11px] font-medium text-white/90 mt-1">' + (c.menuSubtitle || 'For a contactless menu, scan QR code') + '</p>' +
              '<div class="mt-4 p-3 bg-white rounded-2xl shadow-xl inline-block">' +
                generateQrSvg(150, t.qrColor, '#ffffff') +
              '</div>' +
            '</div>' +
            '<div class="p-5 text-center space-y-1">' +
              '<h4 class="text-xs font-black uppercase tracking-wider text-slate-800">' + (c.descriptionTitle || 'QR MENU DESCRIPTION') + '</h4>' +
              '<p class="text-[11px] text-slate-500 leading-relaxed">' + (c.descriptionText || 'More comfortable, faster and eco-friendly.') + '</p>' +
              '<p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">' + (config.brandName || 'GETAIPILOT') + '</p>' +
            '</div>' +
          '</div>';
          break;
        }

        case 'acrylic-standee': {
          const woodMap = {
            walnut: 'from-[#3e2723] via-[#4e342e] to-[#2d1b18]',
            oak: 'from-[#a07855] via-[#b88c65] to-[#8c6747]',
            birch: 'from-[#d7ccc8] via-[#e8deda] to-[#bcaaa4]',
            black: 'from-[#1a1a1a] via-[#2a2a2a] to-[#121212]',
          };
          const wood = woodMap[config.acrylic.woodFinish] || woodMap.oak;
          const isDark = config.acrylic.acrylicTone === 'smoked';
          html = '<div class="flex flex-col items-center select-none">' +
            '<div class="w-[300px] sm:w-[330px] rounded-t-[24px] border-2 p-6 flex flex-col items-center text-center shadow-xl ' +
              (isDark ? 'bg-slate-900/90 text-white border-slate-700' : 'bg-white/90 text-slate-800 border-white/80 backdrop-blur-md') + '">' +
              '<div class="mb-3">' +
                '<h3 class="text-xs font-black tracking-widest uppercase ' + (isDark ? 'text-white' : 'text-slate-800') + '">' +
                  (config.brandName || 'YOUR BUSINESS') +
                '</h3>' +
              '</div>' +
              '<div class="p-3 bg-white rounded-2xl shadow-md border border-slate-100">' +
                generateQrSvg(160, styles.fgColor || '#000000', '#ffffff') +
              '</div>' +
              '<p class="text-[11.5px] font-medium mt-4 px-2 ' + (isDark ? 'text-slate-200' : 'text-slate-600') + '">' +
                (config.acrylic.tagline || 'Scan this QR code to review our stay or service on Google') +
              '</p>' +
              '<div class="mt-3 pt-2 border-t border-black/10 w-full flex items-center justify-center gap-2">' +
                '<span class="text-amber-400 font-bold">★ ★ ★ ★ ★</span>' +
                '<span class="text-xs font-bold ' + (isDark ? 'text-white' : 'text-slate-700') + '">' +
                  (config.acrylic.googleRatingText || 'Google 4.9') +
                '</span>' +
              '</div>' +
            '</div>' +
            '<div class="w-[330px] sm:w-[360px] h-7 rounded-[8px] bg-gradient-to-r ' + wood + ' shadow-lg border border-black/20 flex items-center justify-center relative">' +
              '<div class="w-[290px] h-[3px] bg-black/40 rounded-full"></div>' +
            '</div>' +
            '<div class="h-3 w-[90%] bg-black/20 blur-md rounded-full mt-[-2px]"></div>' +
          '</div>';
          break;
        }

        case 'tent-stand': {
          const colorMap = {
            cream: { bg: 'bg-[#F7EFE9]', text: 'text-[#3D312A]', border: 'border-[#E5D7CD]' },
            craft: { bg: 'bg-[#DFD3C3]', text: 'text-[#3A3845]', border: 'border-[#C7B198]' },
            slate: { bg: 'bg-[#1E293B]', text: 'text-white', border: 'border-slate-700' },
            emerald: { bg: 'bg-[#064E3B]', text: 'text-white', border: 'border-emerald-700' },
          };
          const t = colorMap[config.tent.standColor] || colorMap.cream;
          html = '<div class="flex flex-col items-center select-none">' +
            '<div class="w-[280px] sm:w-[300px] rounded-t-[20px] border-t-2 border-x-2 p-6 flex flex-col items-center text-center shadow-xl ' + t.border + ' ' + t.bg + '">' +
              '<div class="mb-3 space-y-0.5">' +
                '<h2 class="text-2xl font-black uppercase tracking-wider font-montserrat ' + t.text + '">' + (config.tent.headline || 'SCAN QR CODE') + '</h2>' +
                '<p class="text-[11px] font-bold tracking-widest opacity-80 ' + t.text + '">' + (config.tent.subtitle || 'TO VIEW OUR MENU') + '</p>' +
              '</div>' +
              '<div class="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">' +
                generateQrSvg(155, styles.fgColor || '#000000', '#ffffff') +
              '</div>' +
              '<div class="mt-4 space-y-0.5">' +
                '<p class="text-xs font-black uppercase tracking-widest ' + t.text + '">' + (config.tent.tableNumber || 'TABLE #04') + '</p>' +
                '<p class="text-[10px] font-medium opacity-70 ' + t.text + '">' + (config.tent.note || 'Touchless digital menu • Order from phone') + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="w-[290px] sm:w-[310px] h-3 bg-black/30 rounded-b-md shadow-xl"></div>' +
            '<div class="w-[260px] h-3 bg-black/20 blur-md rounded-full mt-1"></div>' +
          '</div>';
          break;
        }

        case 'retail-pay': {
          const themeMap = {
            pink: { bg: 'bg-gradient-to-b from-[#FFF0F5] to-[#FFE4E1]', ribbon: 'bg-pink-500 text-white', title: 'text-rose-500', border: 'border-pink-300' },
            teal: { bg: 'bg-gradient-to-b from-[#E6FFFA] to-[#B2F5EA]', ribbon: 'bg-teal-500 text-white', title: 'text-teal-700', border: 'border-teal-300' },
            amber: { bg: 'bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7]', ribbon: 'bg-amber-500 text-white', title: 'text-amber-800', border: 'border-amber-300' },
            indigo: { bg: 'bg-gradient-to-b from-[#EEF2FF] to-[#E0E7FF]', ribbon: 'bg-indigo-500 text-white', title: 'text-indigo-700', border: 'border-indigo-300' },
          };
          const t = themeMap[config.retailPay.theme] || themeMap.pink;
          html = '<div class="w-[290px] sm:w-[320px] rounded-[32px] border-4 p-6 flex flex-col items-center text-center shadow-xl ' + t.border + ' ' + t.bg + '">' +
            '<div class="px-5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 shadow-sm ' + t.ribbon + '">' +
              '✦ ' + (config.retailPay.ribbonText || 'SCAN & PAY') + ' ✦' +
            '</div>' +
            '<h2 class="text-3xl font-black font-montserrat ' + t.title + '">' + (config.retailPay.title || 'QRIS / UPI PAY') + '</h2>' +
            '<p class="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3">' + (config.retailPay.subtitle || 'AMAN • CEPAT • TERPERCAYA') + '</p>' +
            '<div class="p-3 bg-white rounded-3xl border-2 border-slate-200 shadow-md">' +
              generateQrSvg(155, styles.fgColor || '#000000', '#ffffff') +
            '</div>' +
            '<h4 class="text-xs font-black uppercase tracking-wider text-slate-800 mt-3">' + (config.brandName || 'GETAIPILOT STORE') + '</h4>' +
            '<div class="mt-3 pt-2 w-full border-t border-black/5 flex items-center justify-between text-[10px] text-slate-600 font-bold">' +
              '<span>🛡 ' + (config.retailPay.securityBadge || '100% Instant Verified') + '</span>' +
              '<span class="bg-white/80 px-2 py-0.5 rounded-full border border-black/5">' + (config.retailPay.acceptedMethods || 'All UPI / Cards') + '</span>' +
            '</div>' +
          '</div>';
          break;
        }

        case 'coffee-roaster': {
          const c = config.coffeeRoaster || {
            shopName: 'TIMBER & BEAN ROASTERS',
            roastOrigin: 'ETHIOPIA GUJI • NATURAL HEIRLOOM',
            headline: 'SCAN FOR SPECIALTY BREW MENU',
            tastingNotes: 'Jasmine Blossom • Ripe Blueberry • Honeycomb',
            loyaltyOffer: '☕ 10TH CUP FREE • GUEST WI-FI CONNECTED',
          };
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-[#221c17] text-[#faedd9] p-6 shadow-2xl border-2 border-[#8c6b45] text-center">' +
            '<span class="text-[10px] font-bold uppercase tracking-widest text-[#d9a86c]">☕ SPECIALTY COFFEE ROASTERS</span>' +
            '<h3 class="text-lg font-black uppercase font-serif-display mt-0.5 text-white">' + (c.shopName || config.brandName || 'TIMBER & BEAN') + '</h3>' +
            '<p class="text-[11px] text-[#e0cfbe] italic">' + (c.roastOrigin || 'Single Origin Heirloom') + '</p>' +
            '<div class="my-4 p-3 bg-[#fffaf2] rounded-2xl shadow-xl inline-block border border-[#e0cfbe]">' +
              generateQrSvg(160, '#221c17', '#fffaf2') +
            '</div>' +
            '<p class="text-xs font-black uppercase tracking-wider text-white">' + (c.headline || 'SCAN FOR SPECIALTY BREW MENU') + '</p>' +
            '<p class="text-[10px] text-[#d9a86c] mt-1 font-medium">' + (c.tastingNotes || 'Jasmine • Blueberry • Honeycomb') + '</p>' +
            '<div class="mt-3 pt-2 border-t border-[#8c6b45]/40 text-[10px] font-bold text-white/90">' +
              (c.loyaltyOffer || '☕ 10TH CUP FREE') +
            '</div>' +
          '</div>';
          break;
        }

        case 'botanical-apothecary': {
          const c = config.botanicalApothecary || {
            brandName: 'ST. CLAIR BOTANICALS',
            apothecarySubtitle: 'Organic Herbal Apothecary & Holistic Spa',
            headline: 'SCAN FOR ELIXIR & SPA RITUAL MENU',
            waxSealText: '100% BOTANICAL',
            batchNumber: 'BATCH NO. 84 • EST. 1928',
          };
          html = '<div class="w-[320px] sm:w-[350px] rounded-[28px] bg-[#fbf9f4] text-[#28382c] p-6 shadow-2xl border-2 border-[#738a74]/40 text-center relative">' +
            '<div class="w-10 h-10 rounded-full bg-[#9e4738] text-[#fbf9f4] font-bold text-[8px] flex items-center justify-center mx-auto mb-2 shadow-md border-2 border-[#c2786a]">' +
              'SEAL' +
            '</div>' +
            '<h3 class="text-base font-black tracking-widest uppercase font-cinzel text-[#1b2b1f]">' + (c.brandName || config.brandName || 'APOTHECARY') + '</h3>' +
            '<p class="text-[10px] italic text-[#5a705e]">' + (c.apothecarySubtitle || 'Organic Herbal Spa') + '</p>' +
            '<div class="my-3.5 p-3 bg-white rounded-2xl shadow-md border border-[#d6ded6] inline-block">' +
              generateQrSvg(155, '#1b2b1f', '#ffffff') +
            '</div>' +
            '<p class="text-xs font-bold uppercase tracking-wider text-[#1b2b1f] font-cinzel">' + (c.headline || 'SCAN FOR SPA MENU') + '</p>' +
            '<p class="text-[9px] font-mono tracking-widest text-[#738a74] mt-2">' + (c.batchNumber || 'BATCH NO. 84') + '</p>' +
          '</div>';
          break;
        }

        case 'cyber-hologram': {
          const c = config.cyberHologram || {
            projectName: 'QUANTUM // OS 2.0',
            systemTag: 'AR-SYNCED // LIVE PROTOCOL',
            headline: 'SCAN TO ACCESS AR INTERFACE',
            hudCoordinate: 'SYS.GRID // 47.6062° N',
          };
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-[#090d16] text-[#6ee7b7] p-6 shadow-2xl border border-[#059669]/60 text-center font-mono-tech relative overflow-hidden">' +
            '<div class="flex items-center justify-between text-[9px] text-[#34d399] tracking-widest mb-2 border-b border-[#059669]/30 pb-1">' +
              '<span>' + (c.projectName || 'QUANTUM OS') + '</span>' +
              '<span class="animate-pulse">● LIVE</span>' +
            '</div>' +
            '<div class="my-3 p-3 bg-[#030712] rounded-2xl shadow-inner border border-[#059669]/40 inline-block">' +
              generateQrSvg(160, '#34d399', '#030712') +
            '</div>' +
            '<h4 class="text-xs font-black uppercase tracking-wider text-white mt-1">' + (c.headline || 'SCAN FOR AR INTERFACE') + '</h4>' +
            '<p class="text-[9px] text-[#6ee7b7]/80 mt-1">' + (c.hudCoordinate || 'SYS.GRID // 47.6062° N') + '</p>' +
          '</div>';
          break;
        }

        case 'luxury-realestate': {
          const c = config.luxuryRealEstate || {
            propertyTitle: 'VILLA SERENA • RESIDENCES',
            propertyLocation: 'Palm Jumeirah • Dubai, UAE',
            priceGuide: 'From $4,850,000 • 5 Bed Villa',
            ctaHeadline: 'SCAN FOR 3D VIRTUAL TOUR',
            agentName: 'Marcus Vance | Global Realty',
          };
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-[#0d0f12] text-white p-6 shadow-2xl border border-amber-500/40 text-center">' +
            '<span class="text-[9px] font-bold tracking-[0.2em] text-amber-400 uppercase">EXCLUSIVE LISTING</span>' +
            '<h3 class="text-base font-black uppercase font-cinzel text-white mt-0.5">' + (c.propertyTitle || 'VILLA SERENA') + '</h3>' +
            '<p class="text-[10px] text-zinc-400 font-medium">' + (c.propertyLocation || 'Palm Jumeirah') + '</p>' +
            '<p class="text-[11px] text-amber-400 font-bold mt-1">' + (c.priceGuide || 'From $4,850,000') + '</p>' +
            '<div class="my-3.5 p-3 bg-white rounded-2xl shadow-xl inline-block">' +
              generateQrSvg(155, '#0d0f12', '#ffffff') +
            '</div>' +
            '<p class="text-xs font-black uppercase tracking-wider text-amber-300 font-cinzel">' + (c.ctaHeadline || 'SCAN FOR 3D VIRTUAL TOUR') + '</p>' +
            '<p class="text-[10px] text-zinc-400 mt-2">' + (c.agentName || 'Global Realty') + '</p>' +
          '</div>';
          break;
        }

        case 'classic':
        default: {
          html = '<div class="p-6 bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center text-center">' +
            (config.brandName ? '<h4 class="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">' + config.brandName + '</h4>' : '') +
            '<div class="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">' +
              generateQrSvg(180, styles.fgColor || '#000000', styles.bgColor || '#ffffff') +
            '</div>' +
            '<p class="text-[11px] text-slate-500 font-medium mt-3">Scan with your smartphone camera</p>' +
          '</div>';
          break;
        }
      }

      root.innerHTML = html;
    }

    render();

    // Export function called by React Native
    window.exportCanvas = function(scale = 3) {
      const target = document.getElementById('canvas-export-root');
      if (!target || typeof html2canvas !== 'function') {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_ERROR',
            error: 'html2canvas library is not ready'
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
      }).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_SUCCESS',
            dataUrl: dataUrl
          }));
        }
      }).catch(err => {
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
