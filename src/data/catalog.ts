export interface ProductVariant {
  id: string;
  name: string;
  color: string;
  image?: string;
}

export interface ProductSpecItem {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  file: string;
  category: 'Audio' | 'Gaming' | 'Everyday';
  price: number;
  finish: string;
  color: string;
  badge?: string;
  description: string;
  features: string[];
  specs?: ProductSpecItem[];
  compatibility?: string;
  dimensions?: string;
  includedAccessories?: string[];
  deliveryInfo?: string;
  warranty?: string;
  variants?: ProductVariant[];
  defaultVariant?: string;
}

export interface Chapter {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  category: string;
  kicker: string;
  accent: string;
}

export const catalog: Product[] = [
  {
    id: 'speaker',
    name: 'Speaker & charging dock',
    file: 'speaker-web',
    category: 'Audio',
    price: 3000,
    finish: 'Dark graphite',
    color: '#25282c',
    badge: 'Everyday favorite',
    description: 'Sound, time, and a cleaner bedside. An understated object with more than one way to fit into your day.',
    features: ['Fabric-wrapped body', 'Integrated clock display', 'Circular charging surface'],
    dimensions: '180 × 85 × 85 mm',
    compatibility: 'Qi-enabled smartphones (iPhone, Samsung, etc.), all Bluetooth audio devices',
    includedAccessories: ['USB-C power cable', 'User manual'],
    deliveryInfo: 'Nepal-wide delivery across all 7 provinces. Cash on Delivery available.',
    warranty: '6 months replacement warranty against manufacturing defects.',
    specs: [
      { label: 'Wireless Charging', value: 'Qi standard up to 10W wireless charging' },
      { label: 'Audio Connectivity', value: 'Bluetooth 5.0 wireless + 3.5mm AUX input' },
      { label: 'Clock Display', value: 'Dimmable LED digital clock with 12/24h modes' },
      { label: 'Enclosure', value: 'Acoustic woven fabric wrap with tactile controls' },
    ],
    variants: [
      {
        id: 'black',
        name: 'Dark graphite',
        color: '#25282c',
      },
      {
        id: 'white',
        name: 'White',
        color: '#f0f2f5',
        image: '/assets/previews/speaker-web-white.png?v=1',
      },
    ],
    defaultVariant: 'black',
  },
  {
    id: 'scarlett3',
    name: 'Scarlett Solo · 3rd Gen',
    file: 'scarlett-solo-3rd-gen-web',
    category: 'Audio',
    price: 23000,
    finish: 'Studio red',
    color: '#9d2534',
    badge: 'Studio edit',
    description: 'For the ideas that deserve to be heard. A focused recording setup, in an unmistakable red finish.',
    features: ['Compact desktop interface', 'Front-panel controls', 'Explore the connections in 3D'],
    dimensions: '143.5 × 95.8 × 43.5 mm (320g)',
    compatibility: 'macOS (including Apple Silicon M-series), Windows 10/11, iPadOS via USB-C',
    includedAccessories: ['USB-C to USB-A cable', 'Getting started guide'],
    deliveryInfo: 'Insured courier shipping across Nepal. Parcel tracking included.',
    warranty: '1-year authentic hardware warranty.',
    specs: [
      { label: 'Resolution', value: '24-bit / 192 kHz high-performance converters' },
      { label: 'Mic Preamp', value: '1 Scarlett preamp with switchable Air mode & 48V phantom' },
      { label: 'Inputs / Outputs', value: '1 XLR mic in, 1 1/4" instrument in, balanced TRS monitor outs' },
      { label: 'Power', value: 'USB Type-C bus-powered (no external power brick needed)' },
    ],
  },
  {
    id: 'keyboard',
    name: 'TWOLF TF200 Keyboard & Mouse Combo',
    file: 'twolf-tf200-keyboard-web',
    category: 'Gaming',
    price: 1000,
    finish: 'Black / multicolor',
    color: '#23252a',
    badge: 'Combo set',
    description: 'A complete desktop gaming setup. Rainbow-illuminated suspended keycaps paired with an ergonomic optical gaming mouse for play and daily workflow.',
    features: ['104-key rainbow backlit keyboard', 'Matching ergonomic optical mouse', 'Try the interactive 3D combo demo'],
    dimensions: 'Keyboard: 440 × 130 × 30 mm | Mouse: 125 × 68 × 38 mm',
    compatibility: 'Windows 11 / 10 / 8 / 7, macOS, Linux (standard USB-A port)',
    includedAccessories: ['TF200 104-key Rainbow Keyboard', 'Matching Ergonomic Optical Mouse'],
    deliveryInfo: 'Direct delivery across Nepal. Cash on Delivery accepted.',
    warranty: '3 months store warranty against hardware defects.',
    specs: [
      { label: 'Keyboard Layout', value: '104-key suspended rainbow LED illuminated keycaps' },
      { label: 'Mouse Sensor', value: 'Ergonomic 3D optical sensor (1200 DPI resolution)' },
      { label: 'Connectivity', value: 'Dual wired USB plug-and-play with 1.35m cables' },
      { label: 'Durability', value: 'Tested for up to 10 million keystrokes per key' },
    ],
  },
  {
    id: 'bottle',
    name: 'Foldable silicone bottle',
    file: 'silicone-foldable-bottle-web',
    category: 'Everyday',
    price: 700,
    finish: 'Sage green',
    color: '#a2baa0',
    badge: 'Go lightly',
    description: 'A little less bulk, a little more freedom. 600ml food-grade safety silicone with an origami folding silhouette.',
    features: ['Food-grade safety silicone (BPA-free)', 'Folds down to 20% original volume', '600ml leak-proof capacity with carry strap'],
    dimensions: 'Expanded: 240 × 70 mm (600ml) | Collapsed: 65 × 70 mm',
    compatibility: 'Standard bicycle bottle holders, gym bags, and backpack side pouches',
    includedAccessories: ['Aluminum carabiner clip', 'Integrated silicone carry loop'],
    deliveryInfo: 'Fast delivery across Nepal. Cash on Delivery available.',
    warranty: 'Immediate replacement on delivery for any manufacturing flaws.',
    specs: [
      { label: 'Capacity', value: '600 ml (folds down to approx. 200 ml height)' },
      { label: 'Material', value: '100% BPA-free food-grade silicone + PP twist lid' },
      { label: 'Temperature', value: 'Withstands -50°C to 200°C (-58°F to 392°F)' },
      { label: 'Seal', value: 'Airtight leak-proof twist valve with silicone gasket' },
    ],
    variants: [
      {
        id: 'sage',
        name: 'Sage green',
        color: '#a2baa0',
        image: '/assets/previews/silicone-foldable-bottle-web-sage.png',
      },
      {
        id: 'pink',
        name: 'Blush pink',
        color: '#e8abae',
        image: '/assets/previews/silicone-foldable-bottle-web-pink.png',
      },
      {
        id: 'aqua',
        name: 'Aqua blue',
        color: '#46b8c9',
        image: '/assets/previews/silicone-foldable-bottle-web-aqua.png',
      },
      {
        id: 'grey',
        name: 'Slate grey',
        color: '#888c96',
        image: '/assets/previews/silicone-foldable-bottle-web-grey.png',
      },
    ],
    defaultVariant: 'sage',
  },
  {
    id: 'premium',
    name: '3-in-1 cable · Premium',
    file: '3-in-1-premium-web',
    category: 'Everyday',
    price: 700,
    finish: 'Soft lavender',
    color: '#c6bfd4',
    description: 'One compact little object for a better-connected everyday. The considered addition to your carry, available in 7 expressive finishes.',
    features: ['Three connector ends', 'Retractable cable design', '7 vibrant finishes'],
    dimensions: 'Reel diameter: 52 mm | Extended length: 1.2 m',
    compatibility: 'iPhone/iPad (Lightning), Android & modern gear (USB-C), accessories (Micro-USB)',
    includedAccessories: ['Retractable 3-in-1 cable unit in protective packaging'],
    deliveryInfo: 'Nepal-wide delivery. Cash on Delivery available.',
    warranty: '3 months replacement warranty on reel mechanism and connectors.',
    specs: [
      { label: 'Connectors', value: 'Lightning (iOS), USB Type-C, Micro-USB to standard USB-A' },
      { label: 'Max Current', value: 'Up to 3.0A high-speed fast charging support' },
      { label: 'Mechanism', value: 'Smooth dual-direction ratchet reel with 5 stop lengths' },
      { label: 'Cable Construction', value: 'Reinforced TPE flat ribbon cable with aluminum accents' },
    ],
    variants: [
      {
        id: 'red',
        name: 'Crimson red',
        color: '#c52233',
        image: '/assets/previews/3-in-1-premium-web-red.png?v=1',
      },
      {
        id: 'navy',
        name: 'Navy blue',
        color: '#1a294a',
        image: '/assets/previews/3-in-1-premium-web-navy.png?v=1',
      },
      {
        id: 'green',
        name: 'Pine green',
        color: '#2d5a43',
        image: '/assets/previews/3-in-1-premium-web-green.png?v=1',
      },
      {
        id: 'black',
        name: 'Obsidian black',
        color: '#1f232b',
        image: '/assets/previews/3-in-1-premium-web-black.png?v=1',
      },
      {
        id: 'white',
        name: 'Pearl white',
        color: '#f5f6f8',
        image: '/assets/previews/3-in-1-premium-web-white.png?v=1',
      },
      {
        id: 'orange',
        name: 'Sunset orange',
        color: '#f26435',
        image: '/assets/previews/3-in-1-premium-web-orange.png?v=1',
      },
      {
        id: 'lavender',
        name: 'Soft lavender',
        color: '#c6bfd4',
        image: '/assets/previews/3-in-1-premium-web-lavender.png?v=1',
      },
    ],
    defaultVariant: 'lavender',
  },
  {
    id: 'scarlett4',
    name: 'Scarlett Solo · 4th Gen',
    file: 'scarlett-solo-4th-gen-web',
    category: 'Audio',
    price: 28000,
    finish: 'Studio red',
    color: '#bc3440',
    description: 'Your desk, ready for its next take. Explore a new generation of this instantly recognizable audio interface.',
    features: ['Compact desktop form', 'Red metal exterior', 'Detailed front and rear controls'],
    dimensions: '143 × 96 × 45.5 mm (380g)',
    compatibility: 'macOS Monterey or later, Windows 10/11, iPadOS with USB-C',
    includedAccessories: ['USB-C to USB-C cable', 'USB-A adapter', 'User guide'],
    deliveryInfo: 'Insured delivery across Nepal with parcel verification.',
    warranty: '1-year comprehensive hardware warranty.',
    specs: [
      { label: 'Dynamic Range', value: '120 dB RedNet-grade converter dynamic range' },
      { label: 'Preamp Range', value: 'Ultra-low-noise 4th Gen mic preamp (69dB gain)' },
      { label: 'Smart Controls', value: 'Auto Gain, Clip Safe, and Re-engineered Air Mode' },
      { label: 'Headphone Amp', value: 'High-output headphone amplifier with independent control' },
    ],
  },
  {
    id: 'f26',
    name: 'F26 magnetic cooler',
    file: 'f26-web',
    category: 'Gaming',
    price: 1500,
    finish: 'Carbon / spectrum',
    color: '#303436',
    description: 'A circular silhouette with an unexpected flash of color. Bring another point of view to your gaming setup.',
    features: ['Round magnetic-pad design', 'Cyan and magenta fan accents', 'Detailed back-panel view'],
    dimensions: '62 × 62 × 23 mm (Weight: 65g)',
    compatibility: 'MagSafe iPhones (12 through 16 series); all other phones via included magnetic plate',
    includedAccessories: ['USB-C power cable', 'Magnetic metal adhesive ring'],
    deliveryInfo: 'Nepal-wide delivery. Cash on Delivery and online payments supported.',
    warranty: '3 months warranty against fan or plate failure.',
    specs: [
      { label: 'Cooling Method', value: 'Semiconductor thermoelectric Peltier plate' },
      { label: 'Fan Speed', value: '7-blade high-speed silent fan up to 5500 RPM' },
      { label: 'Lighting', value: 'Dynamic RGB spectrum LED illumination' },
      { label: 'Power Input', value: '5V / 2A Type-C power input' },
    ],
  },
  {
    id: 'f18',
    name: 'F18 clamp cooler',
    file: 'f18-web',
    category: 'Gaming',
    price: 1000,
    finish: 'Black / violet',
    color: '#65529c',
    description: 'Expressive details for a setup that stands out. Get closer to the sculpted housing and violet accents.',
    features: ['Clamp-style housing', 'Violet side accents', 'Exposed fan design'],
    dimensions: '78 × 48 × 25 mm (Weight: 52g)',
    compatibility: 'Fits smartphones with widths from 65 mm to 88 mm (iOS & Android)',
    includedAccessories: ['USB Type-C power cable'],
    deliveryInfo: 'Direct shipping across all 7 provinces in Nepal.',
    warranty: '3 months store warranty.',
    specs: [
      { label: 'Cooling Mechanism', value: 'Centrifugal high-efficiency silent turbo fan' },
      { label: 'Clamp Design', value: 'Spring-loaded clamp with protective silicone grips' },
      { label: 'Lighting Accent', value: 'Atmospheric violet LED halo glow' },
      { label: 'Power Input', value: '5V USB Type-C interface' },
    ],
  },
  {
    id: 'f25',
    name: 'F25 clamp cooler',
    file: 'f25-web',
    category: 'Gaming',
    price: 1200,
    finish: 'Black / silver',
    color: '#8a8c8d',
    description: 'Sharp lines, silver contrasts, and a little extra character. Look at your next accessory from every angle.',
    features: ['Clamp-style silhouette', 'Silver-edged fan grille', 'Compact gaming accessory'],
    dimensions: '82 × 54 × 26 mm (Weight: 68g)',
    compatibility: 'Fits smartphones 67 mm to 85 mm in width (iPhone & Android)',
    includedAccessories: ['USB Type-C power cable'],
    deliveryInfo: 'Nepal-wide shipping. Cash on Delivery available.',
    warranty: '3 months store warranty.',
    specs: [
      { label: 'Cooling Type', value: 'Active semiconductor cooling plate + aluminum heatsink' },
      { label: 'Clamp System', value: 'Dual-side retractable clamp with cushioned silicone pads' },
      { label: 'Fan System', value: 'Hydraulic bearing silent fan with silver trim' },
      { label: 'Power', value: '5V / 2A USB Type-C powered' },
    ],
  },
  {
    id: 'basic',
    name: '3-in-1 cable · Essential',
    file: '3-in-1-basic-web',
    category: 'Everyday',
    price: 500,
    finish: 'Sage green',
    color: '#8fa88e',
    description: 'A cheerful little connection. Three ends, one neatly gathered cable, and a bright spot in your everyday carry.',
    features: ['Three connector ends', 'Round cable organizer', 'Two vibrant finishes'],
    dimensions: 'Cable length: 1.0 m | Central disc: 42 mm diameter',
    compatibility: 'iPhone, iPad, Android USB-C phones, Micro-USB peripherals',
    includedAccessories: ['3-in-1 cable with built-in organizer hub'],
    deliveryInfo: 'Fast delivery across Nepal with Cash on Delivery.',
    warranty: 'Immediate replacement on delivery against defects.',
    specs: [
      { label: 'Connectors', value: 'Lightning (iOS), USB Type-C, Micro-USB to standard USB-A' },
      { label: 'Charging Rate', value: 'Up to 2.4A standard multi-device charging' },
      { label: 'Cord Type', value: 'Reinforced flexible cord with central cable management disc' },
    ],
    variants: [
      {
        id: 'green',
        name: 'Sage green',
        color: '#8fa88e',
        image: '/assets/previews/3-in-1-basic-web-green.png?v=1',
      },
      {
        id: 'red',
        name: 'Coral red',
        color: '#eb3d3e',
        image: '/assets/previews/3-in-1-basic-web-red.png?v=1',
      },
    ],
    defaultVariant: 'green',
  }
];

export const chapters: Chapter[] = [
  {
    id: 'speaker',
    eyebrow: '01 / CURATED AUDIO & DESK GEAR',
    title: 'TECH BEYOND<br><span>THE SCREEN.</span>',
    description: 'Explore authentic audio gear, gaming accessories, and desk essentials with Cash on Delivery across Nepal.',
    cta: 'Shop now →',
    category: 'AUDIO',
    kicker: 'PREMIUM SOUND & WIRELESS DOCK',
    accent: '34,211,238',
  },
  {
    id: 'scarlett3',
    eyebrow: '02 / STUDIO AUDIO',
    title: 'STUDIO<br><span>SOUND.</span>',
    description: 'Crisp acoustics and rich audio clarity for music, streams, and daily listening.',
    cta: 'Shop audio →',
    category: 'AUDIO',
    kicker: 'HIGH FIDELITY LISTENING',
    accent: '34,211,238',
  },
  {
    id: 'keyboard',
    eyebrow: '03 / DESK SETUP',
    title: 'TACTILE<br><span>PRECISION.</span>',
    description: 'Responsive switches and sleek gaming gear built for modern desktop workflows.',
    cta: 'Shop gaming →',
    category: 'GAMING',
    kicker: 'GAMING & WORKFLOW ESSENTIALS',
    accent: '34,211,238',
  },
  {
    id: 'bottle',
    eyebrow: '04 / EVERYDAY GEAR',
    title: 'DAILY<br><span>REFINED.</span>',
    description: 'Smart thermal tracking and durable stainless carry for work, travel, and fitness.',
    cta: 'Shop essentials →',
    category: 'EVERYDAY',
    kicker: 'EVERYDAY ACCESSORIES',
    accent: '34,211,238',
  },
];

export const getProduct = (id: string): Product | undefined => catalog.find(p => p.id === id);

export const formatMoney = (n: number): string => 'Rs. ' + n.toLocaleString('en-US');

export const getPreviewUrl = (p: Product, variantId?: string): string => {
  if (variantId && p.variants) {
    const v = p.variants.find((item) => item.id === variantId);
    if (v?.image) return v.image;
  }
  return `/assets/previews/${p.file}.png?v=7`;
};
export const getModelUrl = (p: Product): string => `/assets/models/${p.file}.glb?v=3`;
