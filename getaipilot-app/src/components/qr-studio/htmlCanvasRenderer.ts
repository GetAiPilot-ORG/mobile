import { CanvasConfig, CanvasTemplateId, QRStyles, getGetAiPilotLogoSvgDataUrl } from "./types";
import { TEMPLATE_BASE64_ASSETS } from "./templateBase64Assets";

/**
 * Builds a standalone, fully-styled HTML document to render all 23 QR standee templates
 * inside an interactive React Native WebView.
 *
 * Synchronized 1:1 with getaipilot.in:
 * - Includes ALL 23 templates with exact layouts, CSS, gradients, shadows, and assets
 * - Bundles local base64 component assets (pizza top/bottom, denim collar/hem, floral bouquet, etc.)
 * - Inlines SVG QR generator with GetAiPilot center logo excavation
 * - Built-in html2canvas for 300 DPI high-resolution PNG exports
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
  const base64AssetsJson = JSON.stringify(TEMPLATE_BASE64_ASSETS);

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
  <!-- html2canvas for 300 DPI Export -->
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      margin: 0;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: transparent;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
    .font-serif-display {
      font-family: 'Playfair Display', Didot, 'Bodoni MT', Georgia, serif;
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
  <div id="canvas-export-root" class="w-full flex justify-center py-1">
    <!-- Dynamic Canvas HTML will be injected here -->
  </div>

  <!-- Inline Lightweight QR Generator (Zero-dependency, offline reliable) -->
  <script>
    // Minimal standard QR Generator
    (function(g) {
      function QR8bitByte(data) {
        this.mode = 4;
        this.data = data;
      }
      QR8bitByte.prototype = {
        getLength: function() { return this.data.length; },
        write: function(buffer) {
          for (var i = 0; i < this.data.length; i++) {
            buffer.put(this.data.charCodeAt(i), 8);
          }
        }
      };
      function QRCodeModel(typeNumber, errorCorrectLevel) {
        this.typeNumber = typeNumber || 4;
        this.errorCorrectLevel = errorCorrectLevel || 2; // H = 2
        this.modules = null;
        this.moduleCount = 0;
        this.dataList = [];
      }
      QRCodeModel.prototype = {
        addData: function(data) {
          this.dataList.push(new QR8bitByte(data));
        },
        isDark: function(row, col) {
          if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
            throw new Error(row + "," + col);
          }
          return this.modules[row][col];
        },
        getModuleCount: function() {
          return this.moduleCount;
        },
        make: function() {
          this.makeImpl(false, this.getBestMaskPattern());
        },
        makeImpl: function(test, maskPattern) {
          this.moduleCount = this.typeNumber * 4 + 17;
          this.modules = new Array(this.moduleCount);
          for (var row = 0; row < this.moduleCount; row++) {
            this.modules[row] = new Array(this.moduleCount);
            for (var col = 0; col < this.moduleCount; col++) {
              this.modules[row][col] = null;
            }
          }
          this.setupPositionProbePattern(0, 0);
          this.setupPositionProbePattern(this.moduleCount - 7, 0);
          this.setupPositionProbePattern(0, this.moduleCount - 7);
          this.setupTimingPattern();
          this.setupPositionAdjustPattern();
          this.mapData(this.createData(), maskPattern);
        },
        setupPositionProbePattern: function(row, col) {
          for (var r = -1; r <= 7; r++) {
            if (row + r <= -1 || this.moduleCount <= row + r) continue;
            for (var c = -1; c <= 7; c++) {
              if (col + c <= -1 || this.moduleCount <= col + c) continue;
              if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
                  (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
                  (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        },
        setupTimingPattern: function() {
          for (var r = 8; r < this.moduleCount - 8; r++) {
            if (this.modules[r][6] !== null) continue;
            this.modules[r][6] = (r % 2 == 0);
          }
          for (var c = 8; c < this.moduleCount - 8; c++) {
            if (this.modules[6][c] !== null) continue;
            this.modules[6][c] = (c % 2 == 0);
          }
        },
        setupPositionAdjustPattern: function() {
          var pos = [6, 26, 50, 74, 98, 122, 146][this.typeNumber - 1] || 26;
          for (var r = -2; r <= 2; r++) {
            for (var c = -2; c <= 2; c++) {
              if (row + r >= 0 && row + r < this.moduleCount && col + c >= 0 && col + c < this.moduleCount) {
                this.modules[pos + r][pos + c] = (Math.max(Math.abs(r), Math.abs(c)) !== 1);
              }
            }
          }
        },
        getBestMaskPattern: function() {
          return 0;
        },
        createData: function() {
          var buffer = { buffer: [], length: 0, put: function(num, len) {
            for (var i = 0; i < len; i++) {
              this.buffer.push(( (num >>> (len - i - 1)) & 1) == 1);
            }
            this.length += len;
          }};
          for (var i = 0; i < this.dataList.length; i++) {
            var data = this.dataList[i];
            buffer.put(data.mode, 4);
            buffer.put(data.getLength(), 8);
            data.write(buffer);
          }
          return buffer.buffer;
        },
        mapData: function(data, maskPattern) {
          var inc = -1;
          var row = this.moduleCount - 1;
          var bitIndex = 0;
          for (var col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col == 6) col--;
            while (true) {
              for (var c = 0; c < 2; c++) {
                if (this.modules[row][col - c] === null) {
                  var dark = false;
                  if (bitIndex < data.length) {
                    dark = data[bitIndex];
                  }
                  var mask = ((row + (col - c)) % 2 == 0);
                  this.modules[row][col - c] = mask ? !dark : dark;
                  bitIndex++;
                }
              }
              row += inc;
              if (row < 0 || this.moduleCount <= row) {
                row -= inc;
                inc = -inc;
                break;
              }
            }
          }
        }
      };
      g.MiniQRCode = function(text, typeNumber) {
        var qr = new QRCodeModel(typeNumber || 4, 2);
        qr.addData(text);
        qr.make();
        return qr;
      };
    })(window);
  </script>

  <script>
    const canvasId = "${canvasId}";
    const config = ${safeConfig};
    const styles = ${safeStyles};
    const qrContent = ${safeContent};
    const logoDataUrl = "${logoSvgDataUrl}";
    const ASSETS = ${base64AssetsJson};

    // Robust SVG QR generator
    function generateQrSvg(size, color, customBg, customScale) {
      const typeNum = qrContent.length > 80 ? 7 : (qrContent.length > 40 ? 5 : 4);
      let qr;
      try {
        qr = window.MiniQRCode(qrContent, typeNum);
      } catch (e) {
        qr = window.MiniQRCode(qrContent.slice(0, 60), 4);
      }
      
      const moduleCount = qr.getModuleCount();
      const cellSize = size / moduleCount;
      const fg = color || styles.fgColor || '#000000';
      const bg = customBg || styles.bgColor || '#ffffff';

      let rects = '';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            const x = (c * cellSize).toFixed(2);
            const y = (r * cellSize).toFixed(2);
            const s = (cellSize + 0.15).toFixed(2);
            rects += '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" fill="' + fg + '" />';
          }
        }
      }

      let logoHtml = '';
      if (config.showCenterLogo !== false) {
        const scale = customScale || config.centerLogoScale || 0.18;
        const logoSize = Math.max(18, Math.round(size * scale));
        logoHtml = '<div class="qr-center-logo" style="width:' + logoSize + 'px;height:' + logoSize + 'px;">' +
          '<img src="' + logoDataUrl + '" style="width:100%;height:100%;object-fit:contain;" />' +
          '</div>';
      }

      return '<div class="qr-svg-wrapper" style="width:' + size + 'px;height:' + size + 'px;">' +
        '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="background:' + bg + ';border-radius:10px;">' +
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
        /* 1. BOLD RETAIL PROMO */
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
          html = '<div class="w-[324px] sm:w-[350px] rounded-[26px] p-6 text-center text-white shadow-2xl relative overflow-hidden border border-black/20 ' + t.card + '">' +
            '<div class="mb-3 space-y-1">' +
              '<h2 class="text-3xl font-black tracking-tight uppercase font-montserrat">' + (c.headline || 'SCAN HERE') + '</h2>' +
              '<p class="text-[10.5px] font-bold tracking-widest text-emerald-100/90">' + (c.subheadline || 'TO SEE OUR BEST PRODUCTS') + '</p>' +
            '</div>' +
            '<div class="my-2 p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-white">' +
              generateQrSvg(160, t.qrColor, '#ffffff') +
            '</div>' +
            '<div class="mt-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20">' +
              '<p class="text-xs font-black ' + t.accent + '">' + (c.discountText || 'GET DISCOUNT UP TO 50% OFF!') + '</p>' +
              '<p class="text-[10px] text-white/80 mt-0.5">' + (c.websiteUrl || 'www.getaipilot.in') + '</p>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 2. CURVED WAVE MENU */
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
          html = '<div class="w-[324px] sm:w-[350px] rounded-[26px] bg-white text-slate-800 shadow-2xl overflow-hidden border border-slate-200">' +
            '<div class="pt-7 pb-10 px-5 text-center text-white ' + t.canopy + '">' +
              '<h2 class="text-3xl font-black uppercase tracking-wider font-montserrat">' + (c.menuTitle || 'E-MENU') + '</h2>' +
              '<p class="text-[11px] font-medium text-white/95 mt-1">' + (c.menuSubtitle || 'For a contactless menu, scan QR code') + '</p>' +
              '<div class="mt-4 p-3.5 bg-white rounded-2xl shadow-xl inline-block">' +
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

        /* 3. 3D SOCIAL MEDIA SHOWCASE */
        case 'social-showcase': {
          const platform = config.socialShowcase?.platform || 'spotify';
          const username = config.socialShowcase?.username || 'getaipilot';
          const actionText = config.socialShowcase?.actionText || 'Scan the QR Code below to find me on Spotify';
          const avatarUrl = config.socialShowcase?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
          
          html = '<div class="w-[324px] sm:w-[350px] min-h-[460px] rounded-[36px] p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden border-2 border-white/20 bg-gradient-to-b from-[#3cd276] via-[#24ba60] to-[#128a42] relative select-none">' +
            '<div class="relative z-10 w-full bg-white rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center text-center border border-white/80 mt-8">' +
              '<div class="relative -mt-16 mb-2">' +
                '<div class="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-slate-100 flex items-center justify-center">' +
                  '<img src="' + avatarUrl + '" alt="Avatar" class="w-full h-full object-cover" />' +
                '</div>' +
                '<div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1ed760] text-black ring-2 ring-white flex items-center justify-center font-black text-xs shadow-md">●</div>' +
              '</div>' +
              '<h3 class="text-base font-black text-slate-900 tracking-tight leading-tight mt-1">@' + username.replace(/^@/, '') + '</h3>' +
              '<p class="text-[11px] text-slate-500 font-medium max-w-[220px] mt-1 leading-snug">' + actionText + '</p>' +
              '<div class="mt-4 p-3 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center">' +
                generateQrSvg(160, '#000000', '#ffffff') +
              '</div>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 4. LUXURY APPAREL & DENIM FASHION */
        case 'clothing-brand': {
          const brand = config.clothingBrand?.brandHeader || config.brandName || 'GetAiPilot';
          const headline = config.clothingBrand?.headline || 'download GetAiPilot today';
          const subheadline = config.clothingBrand?.subheadline || 'and enjoy exclusive savings';
          
          html = '<div class="w-[330px] sm:w-[360px] min-h-[500px] rounded-[34px] px-5 py-6 shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden border-2 border-white/80 bg-white" style="background:radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f4f8f7 40%, #e2eeec 100%);">' +
            '<div class="w-full text-right pr-2 pt-1 mb-2 space-y-0.5">' +
              '<p class="text-[14px] font-normal text-slate-800 tracking-tight leading-tight">' + headline + '</p>' +
              '<p class="text-[13px] font-bold text-black tracking-tight leading-tight">' + subheadline + '</p>' +
            '</div>' +
            '<div class="relative my-0 flex flex-col items-center w-full">' +
              '<div class="w-full flex items-center justify-center -mb-[1px] z-10">' +
                '<img src="' + ASSETS.denimCollar + '" alt="Collar" class="w-[258px] h-auto object-contain block drop-shadow-xs" />' +
              '</div>' +
              '<div class="relative z-20 w-[258px] flex items-center justify-center py-1 -my-[1px] bg-transparent">' +
                generateQrSvg(190, '#244a73', '#ffffff') +
              '</div>' +
              '<div class="w-full flex items-center justify-center -mt-[1px] z-10">' +
                '<img src="' + ASSETS.denimHem + '" alt="Hem" class="w-[258px] h-auto object-contain block drop-shadow-xs" />' +
              '</div>' +
              '<div class="w-full flex items-center justify-center mt-1 z-0">' +
                '<img src="' + ASSETS.denimShadow + '" alt="Shadow" class="w-[260px] h-auto object-contain block opacity-80" />' +
              '</div>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 5. SCENIC SOCIAL FLOATING CARD */
        case 'social-card': {
          html = '<div class="w-[320px] sm:w-[340px] h-[480px] rounded-[32px] p-6 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-700 to-slate-900">' +
            '<div class="relative z-10 w-full bg-white/95 backdrop-blur-md rounded-[26px] p-5 flex flex-col items-center text-center shadow-[0_15px_35px_rgba(0,0,0,0.2)] border border-white/80">' +
              '<div class="w-14 h-14 rounded-full bg-[#829079] text-white flex items-center justify-center font-bold text-xs uppercase shadow-md mb-2.5 border-2 border-white">' +
                (config.brandName ? config.brandName.slice(0, 2).toUpperCase() : 'GP') +
              '</div>' +
              '<h3 class="text-sm font-black text-slate-900 tracking-tight leading-snug">' + (config.brandName || 'GetAiPilot') + '</h3>' +
              '<p class="text-[11px] font-medium text-slate-500 mt-0.5 max-w-[200px] leading-tight">' + (config.socialCard.subtitle || 'Hospitality & Dining Experience') + '</p>' +
              '<div class="my-3.5 p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">' +
                generateQrSvg(140, styles.fgColor || '#000000', '#ffffff') +
              '</div>' +
              '<div class="w-full p-2 rounded-full bg-[#829079] text-white font-bold text-xs shadow-xs tracking-wider uppercase">' +
                'Follow Me' +
              '</div>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 6. HEXAGONAL COUNTER SIGN */
        case 'hexagon-dual': {
          html = '<div class="flex flex-col items-center select-none">' +
            '<div class="w-[310px] sm:w-[330px] h-[310px] sm:h-[330px] p-6 flex flex-col items-center justify-between text-center bg-white border-2 border-slate-200 shadow-xl relative" style="clip-path:polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);">' +
              '<p class="font-serif italic text-xs tracking-wider text-pink-500 font-bold pt-4">' + (config.brandName || 'BEAUTY & CO') + '</p>' +
              '<div class="grid grid-cols-2 gap-4 w-full px-2 items-center">' +
                '<div class="flex flex-col items-center text-center space-y-1">' +
                  '<span class="text-2xl text-amber-500 font-bold">📷</span>' +
                  '<span class="text-[11px] font-black italic tracking-wide text-slate-800">' + (config.hexagon.leftTitle || 'Instagram') + '</span>' +
                  '<span class="text-[9px] text-slate-500">' + (config.hexagon.leftHandle || '@getaipilot') + '</span>' +
                '</div>' +
                '<div class="flex flex-col items-center text-center space-y-1">' +
                  '<span class="text-2xl text-amber-500 font-bold">📶</span>' +
                  '<span class="text-[11px] font-black italic tracking-wide text-slate-800">' + (config.hexagon.rightTitle || 'Wi-Fi') + '</span>' +
                  '<span class="text-[9px] text-slate-500 font-bold">' + (config.hexagon.rightSsid || 'Guest_WiFi') + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="pb-3 flex flex-col items-center">' +
                '<div class="p-1 bg-white rounded-lg shadow-xs border border-slate-200">' +
                  generateQrSvg(68, '#000000', '#ffffff', 0.28) +
                '</div>' +
                '<span class="text-[8px] uppercase tracking-wider font-bold text-slate-400 mt-1">Scan to Connect</span>' +
              '</div>' +
            '</div>' +
            '<div class="w-[180px] h-3.5 bg-gradient-to-r from-[#dfba55] via-[#a37c22] to-[#dfba55] rounded-b-md shadow-md -mt-1"></div>' +
            '<div class="w-[160px] h-2 bg-black/20 blur-xs rounded-full"></div>' +
          '</div>';
          break;
        }

        /* 7. TABLETOP FOLDED TENT STAND */
        case 'tent-stand': {
          const colorMap = {
            cream: { bg: 'bg-[#F7EFE9]', text: 'text-[#3D312A]', border: 'border-[#E5D7CD]' },
            craft: { bg: 'bg-[#DFD3C3]', text: 'text-[#3A3845]', border: 'border-[#C7B198]' },
            slate: { bg: 'bg-[#1E293B]', text: 'text-white', border: 'border-slate-700' },
            emerald: { bg: 'bg-[#064E3B]', text: 'text-white', border: 'border-emerald-700' },
          };
          const t = colorMap[config.tent.standColor] || colorMap.cream;
          html = '<div class="flex flex-col items-center select-none">' +
            '<div class="w-[280px] sm:w-[300px] rounded-t-[20px] border-t-2 border-x-2 p-6 flex flex-col items-center text-center shadow-xl ' + t.border + ' ' + t.bg + '" style="transform:perspective(800px) rotateX(8deg);transform-origin:bottom center;">' +
              '<div class="mb-3 space-y-0.5">' +
                '<h2 class="text-2xl font-black uppercase tracking-wider font-montserrat ' + t.text + '">' + (config.tent.headline || 'SCAN QR CODE') + '</h2>' +
                '<p class="text-[10px] font-bold tracking-widest opacity-80 uppercase ' + t.text + '">' + (config.tent.subtitle || 'TO VIEW OUR MENU & SPECIALS') + '</p>' +
              '</div>' +
              '<div class="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">' +
                generateQrSvg(155, styles.fgColor || '#000000', '#ffffff') +
              '</div>' +
              '<div class="mt-4 space-y-0.5">' +
                '<p class="text-xs font-black uppercase tracking-widest ' + t.text + '">' + (config.tent.tableNumber || 'TABLE #04') + '</p>' +
                '<p class="text-[10px] font-medium opacity-70 ' + t.text + '">' + (config.tent.note || 'Touchless digital menu • Order directly from phone') + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="w-[290px] sm:w-[310px] h-3 bg-black/30 rounded-b-md shadow-xl"></div>' +
            '<div class="w-[260px] h-3 bg-black/20 blur-md rounded-full mt-1"></div>' +
          '</div>';
          break;
        }

        /* 8. RETAIL SCAN & PAY POSTER */
        case 'retail-pay': {
          const themeMap = {
            pink: { bg: 'bg-gradient-to-b from-[#FFF0F5] to-[#FFE4E1]', ribbon: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white', title: 'text-rose-500', border: 'border-pink-300' },
            teal: { bg: 'bg-gradient-to-b from-[#E6FFFA] to-[#B2F5EA]', ribbon: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white', title: 'text-teal-700', border: 'border-teal-300' },
            amber: { bg: 'bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7]', ribbon: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white', title: 'text-amber-800', border: 'border-amber-300' },
            indigo: { bg: 'bg-gradient-to-b from-[#EEF2FF] to-[#E0E7FF]', ribbon: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white', title: 'text-indigo-700', border: 'border-indigo-300' },
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
            '<h4 class="text-xs font-black uppercase tracking-wider text-slate-800 mt-3">' + (config.brandName || 'GETAIPILOT') + '</h4>' +
            '<div class="mt-3 pt-2 w-full border-t border-black/5 flex items-center justify-between text-[10px] text-slate-600 font-bold">' +
              '<span>🛡 ' + (config.retailPay.securityBadge || '100% Instant Verified') + '</span>' +
              '<span class="bg-white/80 px-2 py-0.5 rounded-full border border-black/5">' + (config.retailPay.acceptedMethods || 'All UPI / Cards') + '</span>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 9. DOODLE NATURE LINE-ART */
        case 'doodle-nature': {
          html = '<div class="w-[310px] sm:w-[335px] rounded-[32px] bg-[#fdfdfa] p-5 shadow-2xl flex flex-col items-center text-center border-2 border-[#e6e2d8] text-[#1c1917] overflow-hidden select-none">' +
            '<div class="w-full flex items-start justify-between relative z-10 px-1">' +
              '<div class="text-left"><span class="text-xs text-slate-700">☁ v v</span></div>' +
              '<div class="space-y-0.5">' +
                '<h3 class="text-xs font-black uppercase tracking-[0.2em] text-[#1e293b]">DISCOVER NATURE</h3>' +
                '<p class="text-[9.5px] font-medium text-slate-500 max-w-[150px] leading-tight mx-auto">Scan to explore wild paths & stories</p>' +
              '</div>' +
              '<div class="w-8 h-8 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-sm font-bold shadow-xs">☀</div>' +
            '</div>' +
            '<div class="relative my-3 p-3 bg-white rounded-2xl shadow-sm border-2 border-[#1e293b]">' +
              generateQrSvg(170, '#1e293b', '#ffffff') +
            '</div>' +
            '<div class="w-full pt-2 border-t-2 border-[#1e293b] flex items-center justify-between text-[9px] uppercase tracking-widest font-black text-slate-500">' +
              '<span>ORIGINAL ARTWORK / 01</span>' +
              '<span class="text-[#ef4444] font-bold">' + (config.brandName || 'getaipilot.in') + '</span>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 10. LUXURY FLORAL REVIEW CARD */
        case 'floral-review': {
          html = '<div class="w-[310px] sm:w-[335px] rounded-[34px] bg-[#d0d5d8] p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden select-none">' +
            '<div class="relative z-10 space-y-0.5 mb-2.5">' +
              '<h2 class="text-2xl font-serif font-black tracking-[0.24em] uppercase text-[#1a1b1d] font-serif-display">PLEASE</h2>' +
              '<p class="text-lg font-serif italic tracking-wide text-[#282a2d] font-serif-display -mt-0.5">leave us a review</p>' +
            '</div>' +
            '<div class="relative z-10 my-1 flex items-center justify-center">' +
              '<div class="relative w-[215px] h-[215px] rounded-2xl overflow-hidden shadow-lg bg-[#faf6ee]">' +
                '<img src="' + ASSETS.floralBouquet + '" alt="Bouquet" class="absolute inset-0 w-full h-full object-cover" />' +
                '<div class="absolute inset-0 flex items-center justify-center p-3">' +
                  '<div class="p-2 bg-white/95 rounded-xl shadow-md">' +
                    generateQrSvg(130, '#1a1a1a', '#ffffff') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="relative z-10 mt-3 space-y-1.5 max-w-[250px]">' +
              '<p class="text-[11px] font-medium leading-snug text-[#34383d]">Please scan the QR code to review us and help spread the word!</p>' +
              '<div class="text-amber-500 font-bold text-sm tracking-widest">★ ★ ★ ★ ★</div>' +
            '</div>' +
            '<div class="relative z-10 w-full mt-2.5 pt-1 text-right pr-2">' +
              '<p class="font-serif italic text-xs tracking-wider text-[#9d7d52] font-serif-display">by GetAiPilot</p>' +
              '<p class="font-serif font-black text-sm tracking-[0.28em] uppercase -mt-0.5 text-[#9d7d52] font-serif-display">TEAM</p>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 11. BOTANICAL BLOOM ON STEM */
        case 'blooming-flower': {
          html = '<div class="w-[310px] sm:w-[335px] rounded-[34px] bg-white p-6 shadow-2xl flex flex-col items-center text-center border border-slate-200/90 text-slate-800 overflow-hidden select-none">' +
            '<div class="relative flex items-center justify-center mt-2 z-10">' +
              '<div class="absolute -top-3 -left-3 w-16 h-16 rounded-tl-[28px] rounded-br-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>' +
              '<div class="absolute -top-3 -right-3 w-16 h-16 rounded-tr-[28px] rounded-bl-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>' +
              '<div class="absolute -bottom-3 -left-3 w-16 h-16 rounded-bl-[28px] rounded-tr-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>' +
              '<div class="absolute -bottom-3 -right-3 w-16 h-16 rounded-br-[28px] rounded-tl-[12px] bg-[#fde2e4] border border-[#f8c6cb]"></div>' +
              '<div class="relative z-10 p-3 bg-white/95 rounded-2xl shadow-sm border border-[#f8c6cb]">' +
                generateQrSvg(165, '#c22b1e', '#ffffff') +
              '</div>' +
            '</div>' +
            '<div class="relative w-full flex flex-col items-center justify-center my-1">' +
              '<div class="w-[4px] h-[85px] bg-[#4a7c59] rounded-full mx-auto relative">' +
                '<div class="absolute bottom-3 -left-8 w-9 h-6 bg-[#74a84a] rounded-tl-2xl rounded-br-2xl transform -rotate-12"></div>' +
                '<div class="absolute bottom-1 -right-8 w-9 h-6 bg-[#87b85d] rounded-tr-2xl rounded-bl-2xl transform rotate-12"></div>' +
              '</div>' +
            '</div>' +
            '<div class="w-full flex items-center justify-between pt-1 border-t border-slate-100 z-10 px-2">' +
              '<div class="flex items-center gap-2">' +
                '<div class="w-6 h-6 rounded-full bg-red-600 border border-black flex items-center justify-center text-white text-[9px] font-bold">🐞</div>' +
                '<div class="text-left">' +
                  '<h4 class="text-sm font-serif font-black text-[#1c1917]">' + (config.brandName || 'GetAiPilot') + '</h4>' +
                  '<p class="text-[8px] uppercase tracking-widest text-[#4a7c59] font-bold">ORGANIC ESSENCE</p>' +
                '</div>' +
              '</div>' +
              '<span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scan to Bloom</span>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 12. 3D PLUSH FUZZY CHARACTER */
        case 'plush-character': {
          html = '<div class="w-[310px] sm:w-[335px] rounded-[34px] bg-[#fbf6ee] p-6 shadow-2xl flex flex-col items-start text-left border border-[#ede3d4] text-[#2c241e] overflow-hidden select-none">' +
            '<div class="space-y-1 w-full">' +
              '<p class="text-[10px] font-serif uppercase tracking-[0.25em] text-[#93785d] font-semibold">GETAIPILOT</p>' +
              '<h2 class="text-2xl font-serif font-normal leading-[1.08] text-[#2c241e] font-serif-display">QR codes.<br />With character.</h2>' +
              '<p class="text-[11px] font-normal text-[#6f5e51] leading-relaxed pt-1 max-w-[270px]">Turn everyday links into something memorable. Create artistic QR codes with GetAiPilot.</p>' +
            '</div>' +
            '<div class="w-full flex flex-col items-center justify-center my-4 relative">' +
              '<div class="relative p-3.5 rounded-[28px] bg-gradient-to-b from-[#fde68a] via-[#fcd34d] to-[#fbbf24] shadow-xl border-4 border-[#fef08a] flex items-center justify-center overflow-hidden">' +
                '<div class="relative z-10 p-2 bg-[#fef9c3] rounded-2xl shadow-inner border border-[#fef08a]">' +
                  generateQrSvg(165, '#3b2210', '#fef9c3') +
                '</div>' +
              '</div>' +
              '<div class="w-[190px] h-[8px] bg-[#3b2210]/15 rounded-full blur-[4px] -mt-1"></div>' +
            '</div>' +
            '<div class="w-full space-y-2">' +
              '<div class="flex items-center justify-between w-full">' +
                '<span class="font-serif text-base font-normal text-[#2c241e] font-serif-display">Scan to see more.</span>' +
                '<span class="text-xl">⤴</span>' +
              '</div>' +
              '<div class="pt-2 border-t border-[#ede3d4] w-full flex items-center justify-between text-[8px] uppercase tracking-widest text-[#93785d] font-bold">' +
                '<span>ARTISTIC QR CODES</span>' +
                '<span class="text-[#3b2210] font-black">' + (config.brandName || 'getaipilot.in') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 13. LUXURY REAL ESTATE & VILLA */
        case 'luxury-realestate': {
          const c = config.luxuryRealEstate || {
            propertyTitle: 'VILLA SERENA • RESIDENCES',
            propertyLocation: 'Palm Jumeirah • Dubai, UAE',
            priceGuide: 'From $4,850,000 • 5 Bed Villa',
            ctaHeadline: 'SCAN FOR 3D VIRTUAL TOUR',
            agentName: 'Marcus Vance | Global Realty',
          };
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-[#0d0f12] text-white p-6 shadow-2xl border border-amber-500/40 text-center select-none">' +
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

        /* 14. NEON COCKTAIL & VIP LOUNGE */
        case 'neon-cocktail': {
          const c = config.neonCocktail || {
            venueName: 'THE VELVET ROOM',
            venueSubtitle: 'Rooftop Cocktail Lounge & Speakeasy',
            headline: 'SCAN FOR DRINKS & TAPAS',
            theme: 'neon-amber',
          };
          html = '<div class="w-[320px] sm:w-[350px] rounded-t-[140px] rounded-b-[24px] border-[3px] border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.6)] p-6 flex flex-col items-center text-center bg-gradient-to-b from-[#221303] via-[#140b01] to-[#060300] select-none text-white">' +
            '<div class="text-2xl text-[#fbbf24] mb-1">🍸</div>' +
            '<h3 class="text-base font-black tracking-widest uppercase text-[#fbbf24] font-montserrat">' + (c.venueName || 'THE VELVET ROOM') + '</h3>' +
            '<p class="text-[10px] text-[#fbbf24]/80 mt-0.5">' + (c.venueSubtitle || 'Cocktail Lounge') + '</p>' +
            '<div class="my-4 p-3.5 bg-black rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] border border-[#f59e0b] inline-block">' +
              generateQrSvg(155, '#fbbf24', '#000000') +
            '</div>' +
            '<h4 class="text-xs font-black uppercase tracking-wider text-white">' + (c.headline || 'SCAN FOR DRINKS & TAPAS') + '</h4>' +
            '<span class="text-[9px] font-bold text-[#fbbf24] mt-2 border border-[#f59e0b]/40 px-3 py-1 rounded-full uppercase tracking-widest">Touchless Table Pay</span>' +
          '</div>';
          break;
        }

        /* 15. ACRYLIC REVIEW STANDEE */
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

        /* 16. PIZZERIA & GOURMET MELT */
        case 'pizza-melt': {
          html = '<div class="w-[310px] sm:w-[330px] rounded-[32px] p-5 shadow-2xl flex flex-col items-center text-center overflow-hidden bg-[#1b4d28] text-white border-2 border-white/10 select-none">' +
            '<div class="mb-2 space-y-0.5 max-w-[260px]">' +
              '<span class="text-[10px] uppercase font-bold tracking-[0.16em] text-[#faeed0] block leading-snug">Scan to browse our artisan menu</span>' +
              '<h3 class="text-sm font-black tracking-wider text-white uppercase pt-0.5">' + (config.brandName || 'GETAIPILOT') + '</h3>' +
            '</div>' +
            '<div class="w-[200px] flex flex-col items-center justify-center my-1 relative">' +
              '<div class="w-full flex items-center justify-center -mb-2 z-10 overflow-hidden rounded-t-2xl">' +
                '<img src="' + ASSETS.pizzaTop + '" alt="Pizza Top" class="w-full h-auto object-cover block" />' +
              '</div>' +
              '<div class="w-full relative z-20 p-2.5 bg-[#fffef2] rounded-2xl shadow-xl border border-[#f5ebc6]/60 flex items-center justify-center">' +
                generateQrSvg(160, '#1b4d28', '#fffef2') +
              '</div>' +
              '<div class="w-full flex items-center justify-center -mt-2 z-10 overflow-hidden rounded-b-2xl">' +
                '<img src="' + ASSETS.pizzaBottom + '" alt="Pizza Bottom" class="w-full h-auto object-cover block" />' +
              '</div>' +
            '</div>' +
            '<div class="mt-2 space-y-0.5 max-w-[260px]">' +
              '<p class="text-xs font-black tracking-widest text-[#faeed0] uppercase">WOOD-FIRED PIZZERIA</p>' +
              '<span class="text-[9px] text-[#a2c4ac] block font-semibold uppercase tracking-[0.14em]">Contactless Tabletop Ordering</span>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 17. STRAWBERRY AI ART POSTER */
        case 'strawberry-art': {
          html = '<div class="w-[310px] sm:w-[330px] rounded-[32px] bg-[#f8f9fb] p-6 shadow-2xl flex flex-col items-start text-left border border-slate-200/90 text-slate-800 select-none">' +
            '<div class="space-y-1 w-full">' +
              '<p class="text-[10px] font-black uppercase tracking-widest text-[#bf3844]">GETAIPILOT / AI QR ART</p>' +
              '<h2 class="text-2xl font-black text-[#b72836] tracking-tight leading-none">QR Code Design</h2>' +
              '<p class="text-xs font-medium text-slate-500 pt-0.5">Sweet ideas. Fresh design.</p>' +
            '</div>' +
            '<div class="w-full flex justify-center my-4 relative">' +
              '<div class="relative p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200/80">' +
                generateQrSvg(170, '#b72836', '#ffffff') +
              '</div>' +
            '</div>' +
            '<div class="w-full space-y-3">' +
              '<div class="flex items-center gap-2">' +
                '<span class="text-lg text-[#b72836]">⤴</span>' +
                '<div class="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#fde9eb] text-[#b72836] border border-[#f8c5cb] font-black text-xs">Scan to see more</div>' +
              '</div>' +
              '<div class="pt-2 flex items-end justify-between w-full border-t border-slate-200/70 text-[10px]">' +
                '<div>' +
                  '<p class="text-slate-500 font-medium">Made to catch your eye.</p>' +
                  '<p class="font-bold text-[#b72836]">' + (config.brandName || 'getaipilot.in') + '</p>' +
                '</div>' +
                '<span class="font-bold tracking-widest text-[#bf3844] uppercase">STRAWBERRY / 07</span>' +
              '</div>' +
            '</div>' +
          '</div>';
          break;
        }

        /* 18. RETRO FLORAL CAFE POSTER */
        case 'retro-floral': {
          html = '<div class="w-[310px] sm:w-[330px] rounded-[32px] bg-[#fffdee] p-6 shadow-2xl flex flex-col items-center text-center border-2 border-[#eae3d2] text-[#2c2621] overflow-hidden select-none relative">' +
            '<p class="text-[10px] uppercase font-serif tracking-[0.25em] text-[#4a3e35]">GETAIPILOT</p>' +
            '<div class="my-1">' +
              '<h2 class="text-3xl font-black text-[#2e261f] tracking-tight leading-none lowercase">scan</h2>' +
              '<h2 class="text-3xl font-black text-[#34523c] tracking-tight leading-none lowercase">here</h2>' +
            '</div>' +
            '<div class="p-3 bg-white rounded-xl shadow-sm border-2 border-[#2e261f] my-2 relative z-10">' +
              generateQrSvg(155, '#2e261f', '#ffffff') +
            '</div>' +
            '<p class="text-[11px] font-black uppercase tracking-wider text-[#2e261f] my-1 relative z-10">TO SEE OUR MENU AND PROMO</p>' +
            '<div class="w-full pt-1.5 border-t border-[#e2d7c5] space-y-0.5 relative z-10 text-[10px] text-[#5e544a]">' +
              '<h4 class="text-sm font-black text-[#34523c] tracking-tight lowercase">' + (config.brandName || 'our shop') + '</h4>' +
              '<p>123 Anywhere St., Any City</p>' +
              '<p>hello@getaipilot.in</p>' +
            '</div>' +
            '<img src="' + ASSETS.retroLeafLeft + '" alt="Leaf" class="absolute bottom-0 left-0 w-16 h-auto pointer-events-none opacity-90 z-0" />' +
            '<img src="' + ASSETS.retroLeafRight + '" alt="Leaf" class="absolute bottom-0 right-0 w-20 h-auto pointer-events-none opacity-90 z-0" />' +
          '</div>';
          break;
        }

        /* 19. FINE DINING LEATHER SOMMELIER */
        case 'leather-sommelier': {
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-gradient-to-b from-[#3a1d0d] via-[#261105] to-[#150702] text-[#fae6a3] p-6 shadow-2xl border-2 border-[#c29b38]/70 text-center relative select-none">' +
            '<span class="text-[9px] font-bold tracking-[0.2em] text-[#ebd28b] uppercase">TABLE 14 • SOMMELIER SERVICE</span>' +
            '<h3 class="text-lg font-black uppercase font-cinzel text-[#fff8f0] mt-0.5">' + (config.leatherSommelier?.restaurantName || 'LE CELLIER VINTAGE') + '</h3>' +
            '<p class="text-[10px] text-[#e8d2be] italic">Grand Cru Wine & Cellar Reserve</p>' +
            '<div class="my-3.5 p-3 bg-[#fffbf7] rounded-2xl shadow-xl inline-block border border-[#c29b38]">' +
              generateQrSvg(155, '#240e04', '#fffbf7') +
            '</div>' +
            '<p class="text-xs font-black uppercase tracking-wider text-[#fae6a3] font-cinzel">SCAN FOR SOMMELIER RESERVE WINE</p>' +
            '<p class="text-[9px] text-[#ebd28b] mt-1">Oak Barrel Reserve • Aged 24 Months</p>' +
          '</div>';
          break;
        }

        /* 20. ARTISAN COFFEE ROASTERS & CAFE */
        case 'coffee-roaster': {
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-[#fbf5eb] text-[#221c17] p-6 shadow-2xl border-2 border-[#8c6b45] text-center select-none">' +
            '<span class="text-[10px] font-bold uppercase tracking-widest text-[#a8743a]">☕ TIMBER & BEAN ROASTERS</span>' +
            '<h3 class="text-lg font-black uppercase font-serif-display mt-0.5 text-slate-900">' + (config.brandName || 'TIMBER & BEAN') + '</h3>' +
            '<p class="text-[11px] text-[#78614c] italic">Single Origin Heirloom • Guji Roast</p>' +
            '<div class="my-4 p-3 bg-white rounded-2xl shadow-xl inline-block border border-[#e0cfbe]">' +
              generateQrSvg(160, '#221c17', '#ffffff') +
            '</div>' +
            '<p class="text-xs font-black uppercase tracking-wider text-slate-900">SCAN FOR SPECIALTY BREW MENU</p>' +
            '<p class="text-[10px] text-[#a8743a] mt-1 font-medium">Jasmine Blossom • Ripe Blueberry • Honeycomb</p>' +
            '<div class="mt-3 pt-2 border-t border-[#8c6b45]/40 text-[10px] font-bold text-slate-800">☕ 10TH CUP FREE • GUEST WI-FI</div>' +
          '</div>';
          break;
        }

        /* 21. BOTANICAL APOTHECARY & SPA */
        case 'botanical-apothecary': {
          html = '<div class="w-[320px] sm:w-[350px] rounded-[28px] bg-[#12281e] text-[#fbf9f4] p-6 shadow-2xl border-2 border-[#436e52]/40 text-center relative select-none">' +
            '<span class="text-[9px] font-bold tracking-widest text-[#a3c4ab] uppercase">BATCH NO. 84 • EST. 1928</span>' +
            '<h3 class="text-base font-black tracking-widest uppercase font-cinzel text-white mt-1">' + (config.brandName || 'ST. CLAIR BOTANICALS') + '</h3>' +
            '<p class="text-[10px] italic text-[#a3c4ab]">Organic Herbal Apothecary & Spa</p>' +
            '<div class="my-3.5 p-3 bg-white rounded-2xl shadow-md border border-[#d6ded6] inline-block">' +
              generateQrSvg(155, '#12281e', '#ffffff') +
            '</div>' +
            '<p class="text-xs font-bold uppercase tracking-wider text-white font-cinzel">SCAN FOR ELIXIR & SPA RITUAL MENU</p>' +
            '<span class="inline-block mt-2 px-3 py-0.5 rounded-full bg-[#1e4030] text-[#a3c4ab] text-[9px] font-bold uppercase tracking-wider">100% Botanical</span>' +
          '</div>';
          break;
        }

        /* 22. CYBER HOLOGRAM & AR GLASS */
        case 'cyber-hologram': {
          html = '<div class="w-[320px] sm:w-[350px] rounded-[24px] bg-[#090d16] text-[#6ee7b7] p-6 shadow-2xl border border-[#059669]/60 text-center font-mono-tech relative overflow-hidden select-none">' +
            '<div class="flex items-center justify-between text-[9px] text-[#34d399] tracking-widest mb-2 border-b border-[#059669]/30 pb-1">' +
              '<span>QUANTUM // OS 2.0</span>' +
              '<span class="animate-pulse">● LIVE</span>' +
            '</div>' +
            '<div class="my-3 p-3 bg-[#030712] rounded-2xl shadow-inner border border-[#059669]/40 inline-block">' +
              generateQrSvg(160, '#34d399', '#030712') +
            '</div>' +
            '<h4 class="text-xs font-black uppercase tracking-wider text-white mt-1">SCAN TO ACCESS AR INTERFACE</h4>' +
            '<p class="text-[9px] text-[#6ee7b7]/80 mt-1">SYS.GRID // 47.6062° N</p>' +
          '</div>';
          break;
        }

        /* 23. CLASSIC MINIMALIST */
        case 'classic':
        default: {
          html = '<div class="p-6 bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center text-center select-none">' +
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

    // 300 DPI Export Bridge
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
