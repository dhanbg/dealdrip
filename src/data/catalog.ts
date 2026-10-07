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
    price: 12999,
    finish: 'Dark graphite',
    color: '#25282c',
    badge: 'Everyday favorite',
    description: 'Sound, time, and a cleaner bedside. An understated object with more than one way to fit into your day.',
    features: ['Fabric-wrapped body', 'Integrated clock display', 'Circular charging surface']
  },
  {
    id: 'scarlett3',
    name: 'Scarlett Solo · 3rd Gen',
    file: 'scarlett-solo-3rd-gen-web',
    category: 'Audio',
    price: 49999,
    finish: 'Studio red',
    color: '#9d2534',
    badge: 'Studio edit',
    description: 'For the ideas that deserve to be heard. A focused recording setup, in an unmistakable red finish.',
    features: ['Compact desktop interface', 'Front-panel controls', 'Explore the connections in 3D']
  },
  {
    id: 'keyboard',
    name: 'TWOLF TF200 Keyboard & Mouse Combo',
    file: 'twolf-tf200-keyboard-web',
    category: 'Gaming',
    price: 15999,
    finish: 'Black / multicolor',
    color: '#23252a',
    badge: 'Combo set',
    description: 'A complete desktop gaming setup. Rainbow-illuminated suspended keycaps paired with an ergonomic optical gaming mouse for play and daily workflow.',
    features: ['104-key rainbow backlit keyboard', 'Matching ergonomic optical mouse', 'Try the interactive 3D combo demo']
  },
  {
    id: 'bottle',
    name: 'Foldable silicone bottle',
    file: 'silicone-foldable-bottle-web',
    category: 'Everyday',
    price: 2499,
    finish: 'Cloud',
    color: '#d4d7cb',
    badge: 'Go lightly',
    description: 'A little less bulk, a little more freedom. An everyday companion with a distinctive folding silhouette.',
    features: ['Flexible folded silhouette', 'Compact everyday design', 'Cloud-colored finish']
  },
  {
    id: 'premium',
    name: '3-in-1 cable · Premium',
    file: '3-in-1-premium-web',
    category: 'Everyday',
    price: 1999,
    finish: 'Lavender',
    color: '#c6bfd4',
    description: 'One compact little object for a better-connected everyday. The considered addition to your carry.',
    features: ['Three connector ends', 'Retractable cable design', 'Soft lavender finish']
  },
  {
    id: 'scarlett4',
    name: 'Scarlett Solo · 4th Gen',
    file: 'scarlett-solo-4th-gen-web',
    category: 'Audio',
    price: 59999,
    finish: 'Studio red',
    color: '#bc3440',
    description: 'Your desk, ready for its next take. Explore a new generation of this instantly recognizable audio interface.',
    features: ['Compact desktop form', 'Red metal exterior', 'Detailed front and rear controls']
  },
  {
    id: 'f26',
    name: 'F26 magnetic cooler',
    file: 'f26-web',
    category: 'Gaming',
    price: 5499,
    finish: 'Carbon / spectrum',
    color: '#303436',
    description: 'A circular silhouette with an unexpected flash of color. Bring another point of view to your gaming setup.',
    features: ['Round magnetic-pad design', 'Cyan and magenta fan accents', 'Detailed back-panel view']
  },
  {
    id: 'f18',
    name: 'F18 clamp cooler',
    file: 'f18-web',
    category: 'Gaming',
    price: 3499,
    finish: 'Black / violet',
    color: '#65529c',
    description: 'Expressive details for a setup that stands out. Get closer to the sculpted housing and violet accents.',
    features: ['Clamp-style housing', 'Violet side accents', 'Exposed fan design']
  },
  {
    id: 'f25',
    name: 'F25 clamp cooler',
    file: 'f25-web',
    category: 'Gaming',
    price: 4499,
    finish: 'Black / silver',
    color: '#8a8c8d',
    description: 'Sharp lines, silver contrasts, and a little extra character. Look at your next accessory from every angle.',
    features: ['Clamp-style silhouette', 'Silver-edged fan grille', 'Compact gaming accessory']
  },
  {
    id: 'basic',
    name: '3-in-1 cable · Essential',
    file: '3-in-1-basic-web',
    category: 'Everyday',
    price: 1299,
    finish: 'Coral',
    color: '#e97370',
    description: 'A cheerful little connection. Three ends, one neatly gathered cable, and a bright spot in your everyday carry.',
    features: ['Three connector ends', 'Round cable organizer', 'Coral-colored finish']
  }
];

export const chapters: Chapter[] = [
  {
    id: 'speaker',
    eyebrow: '01 / AUDIO EXPERIENCE',
    title: 'TECH BEYOND<br><span>THE SCREEN.</span>',
    description: 'Explore premium products in an interactive 3D experience.',
    cta: 'Explore ↓',
    category: 'AUDIO',
    kicker: 'PREMIUM SOUND',
    accent: '239,68,68'
  },
  {
    id: 'scarlett3',
    eyebrow: '01 / AUDIO',
    title: 'AUDIO',
    description: 'Immersive sound for a richer you.',
    cta: 'Shop Audio →',
    category: 'AUDIO',
    kicker: 'YOUR NEXT CREATIVE COMPANION',
    accent: '225,29,72'
  },
  {
    id: 'keyboard',
    eyebrow: '02 / GAMING',
    title: 'GAMING',
    description: 'Every key matters.',
    cta: 'Shop Gaming →',
    category: 'GAMING',
    kicker: 'KEYBOARD & MOUSE COMBO',
    accent: '0,240,255'
  },
  {
    id: 'bottle',
    eyebrow: '04 / LIFESTYLE',
    title: 'LIFESTYLE',
    description: 'Everyday essentials reimagined.',
    cta: 'Shop Lifestyle →',
    category: 'LIFESTYLE',
    kicker: 'LESS BULK. MORE POSSIBILITY.',
    accent: '16,185,129'
  }
];

export const getProduct = (id: string): Product | undefined => catalog.find(p => p.id === id);

export const formatMoney = (n: number): string => 'Rs. ' + n.toLocaleString('en-US');

export const getPreviewUrl = (p: Product): string => `/assets/previews/${p.file}.png?v=7`;
export const getModelUrl = (p: Product): string => `/assets/models/${p.file}.glb?v=3`;
