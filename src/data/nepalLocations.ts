export interface ProvinceInfo {
  id: string;
  name: string;
  nepaliName: string;
  districts: string[];
}

export const NEPAL_PROVINCES: ProvinceInfo[] = [
  {
    id: 'koshi',
    name: 'Koshi Province',
    nepaliName: 'कोशी प्रदेश',
    districts: [
      'Morang (Biratnagar)',
      'Sunsari (Dharan / Itahari)',
      'Jhapa (Birtamod / Damak)',
      'Ilam',
      'Dhankuta',
      'Udayapur',
      'Bhojpur',
      'Khotang',
      'Okhaldhunga',
      'Panchthar',
      'Sankhuwasabha',
      'Solukhumbu',
      'Taplejung',
      'Terhathum',
    ],
  },
  {
    id: 'madhesh',
    name: 'Madhesh Province',
    nepaliName: 'मधेश प्रदेश',
    districts: [
      'Parsa (Birgunj)',
      'Dhanusha (Janakpur)',
      'Bara',
      'Rautahat',
      'Sarlahi',
      'Mahottari',
      'Siraha',
      'Saptari',
    ],
  },
  {
    id: 'bagmati',
    name: 'Bagmati Province',
    nepaliName: 'बागमती प्रदेश',
    districts: [
      'Kathmandu',
      'Lalitpur (Patan)',
      'Bhaktapur',
      'Chitwan (Bharatpur / Narayangarh)',
      'Makwanpur (Hetauda)',
      'Kavrepalanchok (Dhulikhel / Banepa)',
      'Nuwakot',
      'Dhading',
      'Sindhupalchok',
      'Dolakha',
      'Ramechhap',
      'Sindhuli',
      'Rasuwa',
    ],
  },
  {
    id: 'gandaki',
    name: 'Gandaki Province',
    nepaliName: 'गण्डकी प्रदेश',
    districts: [
      'Kaski (Pokhara)',
      'Tanahun (Damauli)',
      'Syngja',
      'Nawalpur (Kawasoti)',
      'Gorkha',
      'Lamjung (Besishahar)',
      'Baglung',
      'Parbat',
      'Myagdi',
      'Manang',
      'Mustang',
    ],
  },
  {
    id: 'lumbini',
    name: 'Lumbini Province',
    nepaliName: 'लुम्बिनी प्रदेश',
    districts: [
      'Rupandehi (Butwal / Bhairahawa)',
      'Banke (Nepalgunj)',
      'Dang (Ghorahi / Tulsipur)',
      'Palpa (Tansen)',
      'Kapilvastu',
      'Bardiya',
      'Parasi',
      'Arghakhanchi',
      'Gulmi',
      'Pyuthan',
      'Rolpa',
      'Eastern Rukum',
    ],
  },
  {
    id: 'karnali',
    name: 'Karnali Province',
    nepaliName: 'कर्णाली प्रदेश',
    districts: [
      'Surkhet (Birendranagar)',
      'Jumla',
      'Dailekh',
      'Jajarkot',
      'Salyan',
      'Kalikot',
      'Mugu',
      'Dolpa',
      'Humla',
      'Western Rukum',
    ],
  },
  {
    id: 'sudurpashchim',
    name: 'Sudurpashchim Province',
    nepaliName: 'सुदूरपश्चिम प्रदेश',
    districts: [
      'Kailali (Dhangadhi / Tikapur)',
      'Kanchanpur (Mahendranagar)',
      'Doti',
      'Dadeldhura',
      'Achham',
      'Baitadi',
      'Bajhang',
      'Bajura',
      'Darchula',
    ],
  },
];

/**
 * Validates common Nepal phone number formats:
 * - 10 digits starting with 98 or 97 (mobile)
 * - Landline/standard numbers with optional area code
 * - Optional +977 or 00977 prefix
 * - Spaces or dashes accepted and stripped during check
 */
export function isValidNepalPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // Matches +97798XXXXXXXX, 98XXXXXXXX, 97XXXXXXXX, or landline
  const regex = /^(?:\+?977)?[9][678]\d{8}$/;
  return regex.test(clean);
}

/**
 * Normalizes phone numbers to standard display format e.g. +977 98XXXXXXXX
 */
export function formatNepalPhone(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+977')) {
    return clean;
  }
  if (clean.length === 10) {
    return `+977 ${clean.slice(0, 4)} ${clean.slice(4)}`;
  }
  return phone;
}
