// ============================================================
// Shared TypeScript types for CampusShopper
// ============================================================

export interface Vendor {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  suburb: string;
  city: string;
  logo_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  price_zar: number;
  image_url: string | null;
  product_url: string | null;       // Link to merchant product page
  merchant_name: string | null;     // Denormalised for SerpApi results
  colours: string[];
  sizes: string[];
  shipping_cost_zar: number;
  rating: number;
  stock_count: number;
  is_active: boolean;
  is_serp_result: boolean;          // true = sourced live from SerpApi
  created_at: string;
  vendor?: Vendor;
  distance_km?: number;
  score?: number;
}


export interface Profile {
  id: string;
  student_number: string | null;
  display_name: string | null;
  university: string | null;
  suburb: string | null;
  lat: number | null;
  lng: number | null;
  monthly_budget_zar: number;
  budget_reset_day: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  profile_id: string;
  fav_colours: string[];
  fav_sizes: string[];
  fav_vendors: string[];
  interests: string[];
  max_shipping_zar: number;
  max_distance_km: number;
  ai_persona_summary?: string | null;
  ai_survey_answers?: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface AISurveyAnswer {
  spendingFocus: string;
  shoppingVibe: string;
  styleDietary: string;
  budgetStrictness: string;
  customNotes: string;
}


export interface Favourite {
  id: string;
  profile_id: string;
  product_id: string;
  saved_at: string;
  product?: Product;
}

export interface Purchase {
  id: string;
  profile_id: string;
  product_id: string | null;
  product_name: string;
  vendor_name: string;
  product_image_url: string | null;  // snapshot at purchase time
  product_url: string | null;        // link to merchant
  quantity: number;
  unit_price: number;
  shipping_cost: number;
  total_zar: number;                 // (unit_price × quantity) + shipping_cost
  budget_before: number | null;      // remaining budget before purchase
  budget_after: number | null;       // remaining budget after purchase
  category: string;
  purchased_at: string;
  product?: Product;
}


export interface SearchRecord {
  id: string;
  profile_id: string;
  query: string;
  filters: SearchFilters;
  result_count: number;
  searched_at: string;
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  colours?: string[];
  sizes?: string[];
  vendorIds?: string[];
  maxShipping?: number;
  maxDistance?: number;
  category?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'distance' | 'recommended';
}

export interface ParsedQuery {
  searchTerms: string[];
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  colours?: string[];
  sizes?: string[];
}

export type CategoryType = 'groceries' | 'textbooks' | 'clothing' | 'toiletries' | 'electronics' | 'data' | 'all';

export const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Groceries',
  textbooks: 'Textbooks & Stationery',
  clothing: 'Clothing & Accessories',
  toiletries: 'Toiletries & Health',
  electronics: 'Electronics',
  data: 'Data & Airtime',
  all: 'All Categories',
};

export const CATEGORY_ICONS: Record<string, string> = {
  groceries: '🛒',
  textbooks: '📚',
  clothing: '👕',
  toiletries: '🧴',
  electronics: '💻',
  data: '📱',
  all: '🛍️',
};

export const INTERESTS = [
  { value: 'gym', label: '🏋️ Gym & Fitness' },
  { value: 'cooking', label: '🍳 Cooking' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'fashion', label: '👗 Fashion' },
  { value: 'tech', label: '💻 Tech' },
  { value: 'beauty', label: '💄 Beauty' },
  { value: 'sport', label: '⚽ Sport' },
  { value: 'music', label: '🎵 Music' },
  { value: 'reading', label: '📖 Reading' },
  { value: 'travel', label: '✈️ Travel' },
];

export const COLOURS = [
  'black', 'white', 'grey', 'navy', 'blue', 'red',
  'green', 'olive', 'yellow', 'pink', 'orange', 'purple',
  'maroon', 'burgundy', 'khaki', 'silver', 'gold', 'brown',
];

export const DURBAN_SUBURBS = [
  'Amanzimtoti', 'Ballito', 'Berea', 'Bluff', 'Chatsworth',
  'Durban CBD', 'Glenwood', 'Hillcrest', 'Isipingo', 'Kloof',
  'La Lucia', 'Morningside', 'Mount Edgecombe', 'Musgrave',
  'New Germany', 'Overport', 'Pinetown', 'Queensburgh',
  'Reservoir Hills', 'Rossburgh', 'Shallcross', 'Springfield',
  'Tongaat', 'Umlazi', 'Umhlanga', 'Verulam', 'Westville',
  'Windermere', 'Yellowwood Park',
];

// Approximate lat/lng for Durban suburbs (for student location)
export const SUBURB_COORDS: Record<string, { lat: number; lng: number }> = {
  'Amanzimtoti': { lat: -30.0520, lng: 30.8780 },
  'Ballito': { lat: -29.5380, lng: 31.2110 },
  'Berea': { lat: -29.8470, lng: 30.9990 },
  'Bluff': { lat: -29.9290, lng: 30.9830 },
  'Chatsworth': { lat: -29.8960, lng: 30.9230 },
  'Durban CBD': { lat: -29.8579, lng: 31.0292 },
  'Glenwood': { lat: -29.8650, lng: 30.9822 },
  'Hillcrest': { lat: -29.7720, lng: 30.7720 },
  'Isipingo': { lat: -29.9870, lng: 30.9350 },
  'Kloof': { lat: -29.7790, lng: 30.8360 },
  'La Lucia': { lat: -29.7690, lng: 31.0560 },
  'Morningside': { lat: -29.8370, lng: 31.0200 },
  'Mount Edgecombe': { lat: -29.7160, lng: 31.0410 },
  'Musgrave': { lat: -29.8557, lng: 30.9845 },
  'New Germany': { lat: -29.8090, lng: 30.8990 },
  'Overport': { lat: -29.8390, lng: 31.0010 },
  'Pinetown': { lat: -29.8175, lng: 30.8561 },
  'Queensburgh': { lat: -29.8810, lng: 30.9400 },
  'Reservoir Hills': { lat: -29.8450, lng: 30.9550 },
  'Rossburgh': { lat: -29.9010, lng: 30.9720 },
  'Shallcross': { lat: -29.8960, lng: 30.9070 },
  'Springfield': { lat: -29.8270, lng: 31.0000 },
  'Tongaat': { lat: -29.5680, lng: 31.1190 },
  'Umlazi': { lat: -29.9690, lng: 30.8980 },
  'Umhlanga': { lat: -29.7300, lng: 31.0784 },
  'Verulam': { lat: -29.6440, lng: 31.0410 },
  'Westville': { lat: -29.8308, lng: 30.9343 },
  'Windermere': { lat: -29.8480, lng: 30.9820 },
  'Yellowwood Park': { lat: -29.9010, lng: 30.9400 },
};
