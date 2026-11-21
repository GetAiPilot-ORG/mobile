export type CanvasTemplateId =
  | "bold-retail-promo"  // Bold Hatch Retail & Product Showcase Standee (Graphic hatching, 50% discount callout, web link)
  | "curved-wave-menu"   // Minimalist Dual-Tone Wave E-Menu Standee (Curved canopy, logo badge, eco-friendly contactless menu)
  | "botanical-apothecary" // Vintage Botanical Apothecary & Luxury Spa Plaque (Pressed herbs, wax seal, herbal tinctures)
  | "leather-sommelier"   // Hand-Stitched Saddle Leather & Cellar Sommelier Menu (Gold corner protectors, wine vintage, table pay)
  | "coffee-roaster"   // Artisan Specialty Coffee Roasters & Cafe Board (Steaming latte cup, roast origin, brew menu)
  | "cyber-hologram"   // Prismatic Holographic Glass & AR Tech Standee (Futuristic HUD, Web3, SaaS keynotes)
  | "acrylic-standee" // Clear acrylic review plaque with wood base (Google Reviews)
  | "social-card"     // Floating card over scenic / mountain / cafe background
  | "hexagon-dual"    // Hexagonal tabletop counter sign (Instagram + WiFi)
  | "tent-stand"      // Folded paper/cardboard restaurant tabletop tent standee
  | "retail-pay"      // Cute/pastel retail payment stand poster (Scan & Pay / QRIS / UPI)
  | "pizza-melt"      // Gourmet pizzeria poster with melted pizza framing QR
  | "strawberry-art"  // Fresh AI QR art poster with strawberry aesthetics & CTA
  | "retro-floral"    // Retro vintage cream daisy cafe poster ("scan here")
  | "social-showcase" // 3D floating token social media showcase (Spotify, Instagram, YouTube, etc.)
  | "clothing-brand"  // Luxury fashion & folded denim apparel poster with seamless QR
  | "doodle-nature"   // Whimsical line-art landscape with sun, trees, cactus & swans
  | "floral-review"   // Luxury tabletop card with oil-painted floral bouquet & 5-star review
  | "blooming-flower" // Tall botanical flower on stem with ladybug branding
  | "plush-character" // Scanfolk 3D fuzzy plush chick character creature
  | "luxury-realestate" // Luxury Real Estate & Villa Showcase (Floorplans, 3D tours, private viewing)
  | "neon-cocktail"    // Neon Cocktail Bar & VIP Lounge Table Standee (Table-side order & drinks menu)
  | "classic";        // Frameless pure custom QR code

export type QRType = "url" | "wifi" | "email" | "vcard" | "review";

export interface QRStyles {
  fgColor: string;
  bgColor: string;
  level: "L" | "M" | "Q" | "H";
  size: number;
  includeMargin: boolean;
  imageSettings?: {
    src: string;
    x?: number;
    y?: number;
    height: number;
    width: number;
    excavate: boolean;
  };
}

export interface CanvasConfig {
  // Shared
  brandName: string;
  targetUrl: string;
  logoUrl?: string;

  // Center Logo in QR Code
  showCenterLogo?: boolean;
  centerLogoUrl?: string;
  centerLogoBadgeType?: "auto" | "getaipilot" | "custom" | "monogram" | "google" | "instagram" | "wifi" | "pay";
  centerLogoScale?: number; // 0.18 - 0.28, default ~0.24

  // Acrylic Standee
  acrylic: {
    tagline: string;
    googleRatingText: string;
    woodFinish: "walnut" | "oak" | "birch" | "black";
    acrylicTone: "clear" | "frosted" | "smoked";
  };

  // Social Card
  socialCard: {
    subtitle: string;
    buttonText: string;
    bgTheme: "mountain" | "cafe" | "gradient-purple" | "gradient-emerald" | "custom";
    customBgUrl: string;
  };

  // Hexagon Dual
  hexagon: {
    leftTitle: string;
    leftHandle: string;
    rightTitle: string;
    rightSsid: string;
    rightPassword: string;
    plateColor: "white" | "black" | "frosted";
    accentMetal: "gold" | "rosegold" | "silver";
  };

  // Tent Stand
  tent: {
    headline: string;
    subtitle: string;
    tableNumber: string;
    note: string;
    standColor: "cream" | "craft" | "slate" | "emerald";
  };

  // Retail Pay Poster
  retailPay: {
    ribbonText: string;
    title: string;
    subtitle: string;
    theme: "pink" | "teal" | "amber" | "indigo";
    mascot: "bear" | "shopping" | "coffee" | "star";
    securityBadge: string;
    acceptedMethods: string;
  };

  // Pizza Melt Poster
  pizzaMelt: {
    headline: string;
    tagline: string;
    badgeText: string;
    bgTone: "green" | "red" | "dark" | "terracotta";
  };

  // Strawberry Art Poster
  strawberryArt: {
    categoryText: string;
    headline: string;
    subheadline: string;
    buttonText: string;
    footerText: string;
    tagNumber: string;
  };

  // Retro Floral Daisy Poster
  retroFloral: {
    topBrand: string;
    headline: string;
    subheadline: string;
    shopName: string;
    address: string;
    phone: string;
    email: string;
  };

  // Social Showcase
  socialShowcase: {
    platform: "spotify" | "instagram" | "youtube" | "tiktok" | "twitter" | "facebook" | "linkedin";
    username: string;
    actionText: string;
    avatarUrl: string;
    bgTheme: "emerald" | "violet" | "midnight" | "crimson";
  };

  // Luxury Denim & Apparel Poster
  clothingBrand: {
    brandHeader: string;
    headline: string;
    subheadline: string;
    highlightText: string;
    promoBadge: string;
    apparelWash: "classic-denim" | "vintage-fade" | "raw-indigo" | "black-twill";
    footerText: string;
    poweredBy: string;
    legalNotice: string;
    appStoreNote: string;
  };

  // Whimsical Doodle Nature Poster
  doodleNature: {
    headline: string;
    subheadline: string;
    showSun: boolean;
    bottomTag: string;
  };

  // Luxury Floral Bouquet Review Card
  floralReview: {
    headerTitle: string;
    scriptSubtitle: string;
    promptText: string;
    ratingStars: number;
    signatureName: string;
    socialHandle: string;
    cardTone: "dove-gray" | "parchment" | "blush" | "noir";
    accentFoil: "gold" | "rose-gold" | "silver";
  };

  // Blooming Flower on Stem Poster
  bloomingFlower: {
    brandName: string;
    tagline: string;
    petalTone: "rose" | "amber" | "violet" | "emerald";
    showLadybug: boolean;
  };

  // Scanfolk 3D Plush Chick Character
  plushCharacter: {
    brandTag: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    footerTag: string;
  };

  // Luxury Real Estate & Villa Showcase
  luxuryRealEstate: {
    propertyTitle: string;
    propertyLocation: string;
    priceGuide: string;
    ctaHeadline: string;
    ctaSubheadline: string;
    agentName: string;
    agentPhone: string;
    theme: "obsidian-gold" | "travertine-brass" | "monaco-white" | "emerald-estate";
    badgeTag: string;
    bedrooms?: string;
    bathrooms?: string;
    areaSqFt?: string;
    viewType?: string;
  };

  // Neon Cocktail Bar & VIP Lounge
  neonCocktail: {
    venueName: string;
    venueSubtitle: string;
    tableOrSection: string;
    headline: string;
    subheadline: string;
    happyHourText: string;
    theme: "neon-amber" | "cyber-magenta" | "electric-emerald" | "midnight-violet";
    showOrderIcon: boolean;
  };

  // Artisan Specialty Coffee Roaster & Cafe Board
  coffeeRoaster: {
    shopName: string;
    roastOrigin: string;
    headline: string;
    subheadline?: string;
    tastingNotes: string;
    loyaltyOffer: string;
    coffeeBeansBadge: string;
    theme: "walnut-espresso" | "nordic-oak" | "terracotta-clay" | "matte-obsidian";
  };

  // Prismatic Cyber Hologram & AR Tech Standee
  cyberHologram: {
    projectName: string;
    systemTag: string;
    headline: string;
    subheadline: string;
    hudCoordinate: string;
    actionBadge: string;
    theme: "iridescent-prism" | "matrix-cyan" | "solar-flare" | "quantum-emerald";
  };

  // Vintage Botanical Apothecary & Luxury Spa Plaque
  botanicalApothecary: {
    brandName: string;
    apothecarySubtitle: string;
    headline: string;
    subheadline?: string;
    batchNumber: string;
    waxSealText: string;
    ingredientsList: string;
    theme: "emerald-sage" | "vintage-amber" | "rose-quartz" | "midnight-apothecary";
  };

  // Hand-Stitched Saddle Leather & Cellar Sommelier Menu
  leatherSommelier: {
    restaurantName: string;
    sommelierTitle: string;
    headline: string;
    subheadline?: string;
    vintageRating: string;
    tableNumber: string;
    pairingNote: string;
    theme: "saddle-cognac" | "midnight-noir" | "bordeaux-burgundy" | "forest-hunter";
  };

  // Bold Hatch Retail & Product Showcase Standee
  boldRetailPromo: {
    headline: string;
    subheadline: string;
    discountText: string;
    websiteUrl: string;
    theme: "forest-gold" | "navy-coral" | "crimson-amber" | "obsidian-lime";
  };

  // Minimalist Dual-Tone Wave E-Menu Standee
  curvedWaveMenu: {
    menuTitle: string;
    menuSubtitle: string;
    descriptionTitle: string;
    descriptionText: string;
    logoText?: string;
    logoUrl?: string;
    theme: "teal-ocean" | "indigo-night" | "terracotta-warm" | "emerald-deep";
  };
}

export interface CanvasTemplateMeta {
  id: CanvasTemplateId;
  name: string;
  category: string;
  tagline: string;
  iconName: string;
  badge: string;
  description: string;
}

export const CANVAS_TEMPLATES: CanvasTemplateMeta[] = [
  {
    id: "bold-retail-promo",
    name: "Bold Retail Product Promo",
    category: "Retail, Storefronts & Offers",
    tagline: "Forest green & gold hatch poster with 50% discount callout",
    iconName: "pricetag-outline",
    badge: "Promo Poster",
    description: "High-impact modern retail poster for product launches, storefront displays, and flash sales with diagonal hatching and web domain link.",
  },
  {
    id: "curved-wave-menu",
    name: "Modern Wave Digital E-Menu",
    category: "Restaurants, Cafes & Bars",
    tagline: "Two-tone ocean teal & white wave standee with custom logo badge",
    iconName: "restaurant-outline",
    badge: "Digital E-Menu",
    description: "Clean dual-tone curved wave standee for restaurants, cafes, food trucks, and bistros highlighting contactless mobile menus.",
  },
  {
    id: "botanical-apothecary",
    name: "Botanical Apothecary & Spa",
    category: "Wellness, Spas & Beauty",
    tagline: "Vintage arched plaque with pressed eucalyptus & wax seal stamp",
    iconName: "leaf-outline",
    badge: "Handcrafted",
    description: "Crafted for luxury day spas, wellness clinics, boutique perfumeries, and skincare apothecaries with gold wax seal.",
  },
  {
    id: "leather-sommelier",
    name: "Fine Dining Leather Sommelier",
    category: "Fine Dining & Wineries",
    tagline: "Hand-stitched saddle leather with gold brass corners & wine cellar notes",
    iconName: "wine-outline",
    badge: "Fine Dining",
    description: "Bespoke saddle-stitched leather plaque for Michelin-starred dining, private wine cellars, and luxury tasting lounges.",
  },
  {
    id: "coffee-roaster",
    name: "Artisan Coffee Roasters & Cafe",
    category: "Specialty Cafes & Bakeries",
    tagline: "Warm Scandinavian birch cafe board with latte art & tasting notes",
    iconName: "cafe-outline",
    badge: "Artisan",
    description: "Designed for coffee shops, espresso bars, and bakeries with latte art, single-origin notes, and daily brew menu.",
  },
  {
    id: "cyber-hologram",
    name: "Prismatic Cyber Hologram & AR",
    category: "Tech, SaaS & Events",
    tagline: "Futuristic iridescent glass HUD with coordinate grid & live protocol",
    iconName: "hardware-chip-outline",
    badge: "AR & Tech",
    description: "High-tech iridescent acrylic standee for developer conferences, Web3 lounges, and cutting-edge tech exhibitions.",
  },
  {
    id: "acrylic-standee",
    name: "Clear Acrylic Review Plaque",
    category: "Hotels, Clinics & Salons",
    tagline: "Clear acrylic block on solid walnut/oak base for Google Reviews",
    iconName: "star-outline",
    badge: "Google 5-Star",
    description: "Architectural clear acrylic tabletop plaque anchored in a hardwood block to boost 5-star Google customer reviews.",
  },
  {
    id: "social-card",
    name: "Scenic Floating Card",
    category: "Creators & Influencers",
    tagline: "Translucent card floating over mountain or cafe scenery",
    iconName: "share-social-outline",
    badge: "Social Profile",
    description: "Modern lifestyle card with rounded avatar, title, description, and 'Follow Me' CTA for bio links and Instagram.",
  },
  {
    id: "hexagon-dual",
    name: "Hexagonal Counter Sign",
    category: "Salons, Cafes & Studios",
    tagline: "Dual-sided luxury sign for Instagram + Free Wi-Fi",
    iconName: "wifi-outline",
    badge: "Dual Feature",
    description: "Geometric luxury tabletop counter sign featuring Instagram handle on one side and guest Wi-Fi credentials on the other.",
  },
  {
    id: "tent-stand",
    name: "Tabletop Folded Tent Stand",
    category: "Restaurants & Bars",
    tagline: "Self-standing desk tent for digital menus",
    iconName: "fast-food-outline",
    badge: "Dining",
    description: "Clean restaurant table tent stand for contact-free menu viewing, daily specials, and tabletop ordering.",
  },
  {
    id: "retail-pay",
    name: "Retail Scan & Pay Poster",
    category: "Storefront & Retail",
    tagline: "Pastel retail payment standee (QRIS / UPI / Paytm)",
    iconName: "card-outline",
    badge: "Checkout",
    description: "Eye-catching tabletop cashier display for instant mobile payments with security badges and merchant branding.",
  },
  {
    id: "pizza-melt",
    name: "Artisan Pizza Melt Poster",
    category: "Pizzerias & Trattorias",
    tagline: "Melting mozzarella frame with wood-fired pizzeria styling",
    iconName: "pizza-outline",
    badge: "Food & Dining",
    description: "Rustic Italian trattoria poster with wood-fired oven textures and appetizing cheese-melt framing.",
  },
  {
    id: "strawberry-art",
    name: "Sweet Strawberry QR Art",
    category: "Boutiques & Bakeries",
    tagline: "Fresh fruit aesthetic with delicate leaf accents & modern serif typography",
    iconName: "nutrition-outline",
    badge: "Aesthetic Art",
    description: "Sweet strawberry themed design with botanical leaves, pastel cream backdrop, and creative framing.",
  },
  {
    id: "retro-floral",
    name: "Retro Daisy Cafe Poster",
    category: "Vintage Cafes & Shops",
    tagline: "Cream & olive daisy aesthetic with 'scan here' banner & shop info",
    iconName: "flower-outline",
    badge: "Retro Chic",
    description: "Nostalgic 70s-inspired warm cream poster with blooming daisies and full store contact ledger.",
  },
  {
    id: "social-showcase",
    name: "3D Social Media Token",
    category: "Music & Entertainment",
    tagline: "3D floating token standee with brand avatar & platform badges",
    iconName: "musical-notes-outline",
    badge: "Media Token",
    description: "Eye-catching acrylic social disc featuring Spotify, YouTube, or TikTok handles with profile avatar.",
  },
  {
    id: "clothing-brand",
    name: "Denim & Luxury Apparel",
    category: "Fashion & Retail",
    tagline: "Textured denim wash with gold stitched accents & brand tag",
    iconName: "shirt-outline",
    badge: "Fashion Retail",
    description: "High-end fashion retail display with denim weave texture, contrast gold stitching, and seasonal promo badges.",
  },
  {
    id: "doodle-nature",
    name: "Doodle Nature Line-Art",
    category: "Creative & Art",
    tagline: "Whimsical line-art landscape with sun, trees & swans",
    iconName: "sparkles-outline",
    badge: "Line Art",
    description: "Intricate black line-art nature landscape with sun, cactus, clouds, pyramids, and floating swans framing colorful finder patterns.",
  },
  {
    id: "floral-review",
    name: "Luxury Floral Review Card",
    category: "Florists, Spas & Salons",
    tagline: "Tabletop card with oil-painted bouquet & 5-star review",
    iconName: "star-half-outline",
    badge: "5-Star Review",
    description: "Chic luxury review card featuring 'PLEASE leave us a review', oil-painted floral bouquet centerpiece, 5 golden stars, and designer signature.",
  },
  {
    id: "blooming-flower",
    name: "Botanical Bloom on Stem",
    category: "Organic & Wellness",
    tagline: "Blooming flower QR with green stem & ladybug brand",
    iconName: "rose-outline",
    badge: "Botanical",
    description: "Unique floral poster where liquid amber/crimson QR modules form flower petals with a golden seed center, tall green stem, and ladybug logo.",
  },
  {
    id: "plush-character",
    name: "3D Plush Fuzzy Character",
    category: "Character & Gaming",
    tagline: "GetAiPilot cute fuzzy chick creature with 3D fur QR",
    iconName: "happy-outline",
    badge: "Trending 3D",
    description: "Adorable tactile 3D plush creature cube whose soft yellow fur and dark markings naturally shape the QR code, with hand-drawn scan arrow.",
  },
  {
    id: "luxury-realestate",
    name: "Luxury Real Estate & Villa",
    category: "Real Estate & Estates",
    tagline: "Obsidian & gold plaque for virtual tours, architectural floorplans & VIP viewings",
    iconName: "business-outline",
    badge: "Ultra Luxury",
    description: "Plaque for luxury penthouses, waterfront villas, and estates with 3D walkthrough booking and agent dossier.",
  },
  {
    id: "neon-cocktail",
    name: "Neon Cocktail & VIP Lounge",
    category: "Nightlife, Bars & Clubs",
    tagline: "Dark amber & cyan neon tabletop standee for bottle service & craft drinks",
    iconName: "beer-outline",
    badge: "Nightlife",
    description: "Glowing tabletop lounge standee designed for dimly lit cocktail bars, speakeasies, and rooftop lounges.",
  },
  {
    id: "classic",
    name: "Frameless Minimalist QR",
    category: "General Purpose",
    tagline: "Pure standalone high-resolution QR code",
    iconName: "qr-code-outline",
    badge: "Clean",
    description: "Direct vector QR code without canvas framing, ideal for stickers, packaging, and custom graphic design integration.",
  },
];

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  brandName: "GetAiPilot",
  targetUrl: "https://getaipilot.in",
  logoUrl: "",
  showCenterLogo: true,
  centerLogoBadgeType: "getaipilot",
  centerLogoScale: 0.18,

  acrylic: {
    tagline: "Scan this QR code to review our stay or service on Google",
    googleRatingText: "Google 4.9 ★★★★★",
    woodFinish: "oak",
    acrylicTone: "clear",
  },

  socialCard: {
    subtitle: "Hospitality & Dining Experience",
    bgTheme: "mountain",
    customBgUrl: "",
    buttonText: "",
  },

  hexagon: {
    leftTitle: "Instagram",
    leftHandle: "@grand_vista",
    rightTitle: "Wi-Fi Access",
    rightSsid: "GrandVista_Guest",
    rightPassword: "welcomevista26",
    plateColor: "white",
    accentMetal: "gold",
  },

  tent: {
    headline: "SCAN QR CODE",
    subtitle: "TO VIEW OUR MENU & SPECIALS",
    tableNumber: "TABLE #04",
    note: "Touchless digital menu • Order directly from your phone",
    standColor: "cream",
  },

  retailPay: {
    ribbonText: "SCAN & PAY",
    title: "QRIS / UPI PAY",
    subtitle: "AMAN • CEPAT • TERPERCAYA",
    theme: "pink",
    mascot: "bear",
    securityBadge: "100% Instant Verified",
    acceptedMethods: "All UPI / GPay / Cards",
  },

  pizzaMelt: {
    headline: "WOOD-FIRED PIZZERIA",
    tagline: "Scan to browse our artisan menu & order table-side",
    badgeText: "HOT & FRESH",
    bgTone: "green",
  },

  strawberryArt: {
    categoryText: "GETAIPILOT / AI QR ART",
    headline: "QR Code Design",
    subheadline: "Sweet ideas. Fresh design.",
    buttonText: "Scan to see more",
    footerText: "Made to catch your eye.",
    tagNumber: "STRAWBERRY / 07",
  },

  retroFloral: {
    topBrand: "GETAIPILOT CAFE",
    headline: "scan here",
    subheadline: "TO SEE OUR MENU AND PROMO",
    shopName: "GetAiPilot",
    address: "123 Anywhere St., Any City",
    phone: "+91 89822 85510",
    email: "hello@getaipilot.in",
  },

  socialShowcase: {
    platform: "spotify",
    username: "getaipilot",
    actionText: "Scan the QR Code below to find GetAiPilot on Spotify",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    bgTheme: "emerald",
  },

  clothingBrand: {
    brandHeader: "GetAiPilot",
    headline: "download GetAiPilot today",
    subheadline: "and enjoy exclusive savings",
    highlightText: "on your favourite designer brands",
    promoBadge: "",
    apparelWash: "classic-denim",
    footerText: "download the GetAiPilot App",
    poweredBy: "GetAiPilot",
    legalNotice: "Licensed & regulated as Ancillary Payment Service Provider by CBB.",
    appStoreNote: "*Terms and conditions apply.",
  },

  doodleNature: {
    headline: "DISCOVER NATURE",
    subheadline: "Scan to explore wild paths & handcrafted stories",
    showSun: true,
    bottomTag: "GETAIPILOT ORIGINAL / 01",
  },

  floralReview: {
    headerTitle: "PLEASE",
    scriptSubtitle: "leave us a review",
    promptText: "Please scan the QR code to review us and help spread the word!",
    ratingStars: 5,
    signatureName: "GetAiPilot Team",
    socialHandle: "@getaipilot",
    cardTone: "dove-gray",
    accentFoil: "gold",
  },

  bloomingFlower: {
    brandName: "GetAiPilot",
    tagline: "ORGANIC ESSENCE",
    petalTone: "rose",
    showLadybug: true,
  },

  plushCharacter: {
    brandTag: "GETAIPILOT",
    headline: "QR codes. With character.",
    subheadline: "Turn everyday links into something memorable. Create artistic QR codes with GetAiPilot.",
    ctaText: "Scan to see more.",
    footerTag: "ARTISTIC QR CODES / MADE TO BE SCANNED",
  },

  luxuryRealEstate: {
    propertyTitle: "VILLA SERENA • RESIDENCES",
    propertyLocation: "Palm Jumeirah • Dubai, UAE",
    priceGuide: "From $4,850,000 • 5 Bed Villa",
    ctaHeadline: "SCAN FOR 3D VIRTUAL TOUR",
    ctaSubheadline: "View interactive architectural floorplans, drone cinematography & private viewing booking",
    agentName: "Marcus Vance | Global Realty",
    agentPhone: "+971 50 123 4567",
    theme: "obsidian-gold",
    badgeTag: "EXCLUSIVE LISTING",
    bedrooms: "5 Beds",
    bathrooms: "6 Baths",
    areaSqFt: "7,850 Sq Ft",
    viewType: "Private Beach",
  },

  neonCocktail: {
    venueName: "THE VELVET ROOM",
    venueSubtitle: "Rooftop Cocktail Lounge & Speakeasy",
    tableOrSection: "VIP BOOTH #07",
    headline: "SCAN FOR DRINKS & TAPAS",
    subheadline: "Order craft cocktails & bottle service directly to your table",
    happyHourText: "HAPPY HOUR • 2-FOR-1 TIL 9 PM",
    theme: "neon-amber",
    showOrderIcon: true,
  },

  coffeeRoaster: {
    shopName: "TIMBER & BEAN ROASTERS",
    roastOrigin: "ETHIOPIA GUJI • NATURAL HEIRLOOM",
    headline: "SCAN FOR SPECIALTY BREW MENU",
    subheadline: "View pour-over brew guide, seasonal single-origins, bakery pairings & order ahead.",
    tastingNotes: "Jasmine Blossom • Ripe Blueberry • Honeycomb • Bergamot",
    loyaltyOffer: "☕ 10TH CUP FREE • GUEST WI-FI CONNECTED",
    coffeeBeansBadge: "FRESH ROAST • SINGLE ORIGIN",
    theme: "nordic-oak",
  },

  cyberHologram: {
    projectName: "QUANTUM // OS 2.0",
    systemTag: "AR-SYNCED // LIVE PROTOCOL",
    headline: "SCAN TO ACCESS AR INTERFACE",
    subheadline: "Interactive 3D spatial node, developer beta dossier & keynote stream",
    hudCoordinate: "SYS.GRID // 47.6062° N, 122.3321° W",
    actionBadge: "QUANTUM SECURE",
    theme: "iridescent-prism",
  },

  botanicalApothecary: {
    brandName: "ST. CLAIR BOTANICALS",
    apothecarySubtitle: "Organic Herbal Apothecary & Holistic Spa",
    headline: "SCAN FOR ELIXIR & SPA RITUAL MENU",
    subheadline: "Handcrafted herbal infusions, aromatherapy rituals & bespoke treatments",
    batchNumber: "BATCH NO. 84 • EST. 1928",
    waxSealText: "100% BOTANICAL",
    ingredientsList: "Wild French Lavender • Cold-Pressed Jojoba • Chamomile Blossom",
    theme: "emerald-sage",
  },

  leatherSommelier: {
    restaurantName: "LE CELLIER VINTAGE",
    sommelierTitle: "GRAND CRU WINE & TASTING ROOM",
    headline: "SCAN FOR SOMMELIER RESERVE WINE LIST",
    subheadline: "Curated vintage cellar reserve, artisanal pairings & table-side bill pay",
    vintageRating: "96 PTS // CELLAR SELECTION",
    tableNumber: "TABLE 14 • SOMMELIER SERVICE",
    pairingNote: "Oak Barrel Reserve • Aged 24 Months in French Allier",
    theme: "saddle-cognac",
  },

  boldRetailPromo: {
    headline: "SCAN HERE",
    subheadline: "TO SEE OUR BEST PRODUCTS",
    discountText: "GET DISCOUNT UP TO 50% OFF!",
    websiteUrl: "www.getaipilot.in",
    theme: "forest-gold",
  },

  curvedWaveMenu: {
    menuTitle: "E-MENU",
    menuSubtitle: "For a contactless menu, scan QR code",
    descriptionTitle: "QR MENU DESCRIPTION",
    descriptionText: "More comfortable, faster and environmentally friendly.",
    logoText: "YOUR LOGO",
    theme: "teal-ocean",
  },
};

export interface SavedQRCode {
  id: string;
  content: string;
  title: string;
  style_config: any;
  created_at: string;
}

export interface ReviewFeedback {
  id: string;
  qr_code_id: string;
  rating: number;
  feedback_text: string;
  customer_name?: string;
  created_at: string;
  qr_title?: string;
}

export function getGetAiPilotLogoSvgDataUrl(color: string = "#000000"): string {
  const fillColor = color || "#000000";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 348 353"><path d="M286 13 L299 13 L305 15 L312 19 L318 25 L323 34 L325 41 L324 54 L320 63 L311 72 L298 77 L286 77 L279 75 L271 70 L267 66 L262 58 L260 51 L261 35 L265 27 L274 18 L280 15 L285 14 Z" fill="${fillColor}" /><path d="M140 54 L159 54 L160 55 L175 56 L188 59 L199 63 L223 77 L232 84 L247 99 L257 114 L264 128 L269 144 L270 155 L271 156 L271 173 L270 174 L270 181 L269 182 L268 190 L264 198 L259 203 L253 206 L244 207 L237 205 L230 200 L225 191 L223 159 L219 147 L210 132 L197 119 L180 109 L164 104 L159 104 L158 103 L136 103 L135 104 L130 104 L116 108 L106 113 L90 125 L78 139 L68 158 L64 174 L64 184 L63 185 L64 200 L69 220 L77 236 L83 244 L94 255 L104 262 L122 270 L130 272 L136 272 L137 273 L153 272 L160 269 L168 261 L171 254 L171 245 L169 239 L166 235 L156 228 L152 227 L138 228 L130 226 L124 223 L112 211 L108 203 L106 195 L106 179 L107 178 L107 174 L114 160 L122 152 L130 147 L141 144 L150 144 L158 146 L164 149 L176 161 L181 172 L182 192 L183 193 L183 199 L186 211 L191 222 L198 232 L204 238 L212 244 L220 248 L235 252 L250 252 L251 251 L256 251 L264 249 L275 244 L284 238 L297 225 L306 212 L313 197 L318 181 L320 165 L321 164 L321 143 L322 143 L324 157 L325 158 L325 165 L326 166 L326 199 L325 200 L325 207 L324 208 L323 218 L319 230 L319 233 L317 236 L314 246 L304 265 L291 283 L274 300 L265 307 L251 316 L235 324 L222 329 L202 334 L186 335 L185 336 L163 336 L162 335 L152 335 L151 334 L135 332 L113 325 L96 317 L77 305 L66 296 L52 282 L43 271 L28 246 L21 227 L17 211 L17 205 L16 204 L16 193 L15 192 L16 171 L17 170 L17 164 L18 163 L19 155 L25 137 L34 119 L44 104 L61 86 L70 79 L86 69 L102 62 L124 56 L139 55 Z" fill="${fillColor}" /></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getCenterLogoSettings(
  config: CanvasConfig,
  qrSize: number,
  customScale?: number,
  fgColor: string = "#000000"
): { src: string; height: number; width: number; excavate: boolean } | undefined {
  if (config.showCenterLogo === false) {
    return undefined;
  }
  const scale = customScale || config.centerLogoScale || 0.16;
  const logoSize = Math.max(16, Math.round(qrSize * scale));

  return {
    src: getGetAiPilotLogoSvgDataUrl(fgColor),
    height: logoSize,
    width: logoSize,
    excavate: true,
  };
}
