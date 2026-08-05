// ============================================================
// Natural Language Query Parser
// Uses Google Gemini to extract structured filters from freetext
// Falls back to keyword regex if API call fails
// ============================================================
import { ParsedQuery } from '@/types';

const COLOUR_KEYWORDS = [
  'black', 'white', 'grey', 'gray', 'navy', 'blue', 'red', 'green',
  'olive', 'yellow', 'pink', 'orange', 'purple', 'maroon', 'burgundy',
  'khaki', 'silver', 'gold', 'brown', 'beige', 'cream', 'dark', 'light',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: ['food', 'grocery', 'groceries', 'eat', 'eating', 'meal', 'meals', 'rice', 'bread', 'milk', 'eggs', 'chicken', 'pasta', 'oats'],
  clothing: ['wear', 'wearing', 'clothes', 'clothing', 'jacket', 'hoodie', 'jeans', 'shirt', 'dress', 'shoes', 'sneakers', 'pants', 'shorts', 'top', 'fashion'],
  textbooks: ['book', 'textbook', 'stationery', 'pen', 'notebook', 'calculator', 'study', 'notes', 'module', 'course'],
  electronics: ['tech', 'electronic', 'laptop', 'earphones', 'earbuds', 'charger', 'power bank', 'mouse', 'lamp', 'device'],
  data: ['data', 'airtime', 'sim', 'vodacom', 'mtn', 'cell', 'mobile', 'internet', 'wifi', 'gb'],
  toiletries: ['soap', 'shampoo', 'toothpaste', 'deodorant', 'lotion', 'cream', 'pharmacy', 'health', 'vitamin', 'medicine'],
};

export function parseQueryLocally(query: string): ParsedQuery {
  const lower = query.toLowerCase();
  const result: ParsedQuery = { searchTerms: [] };

  // Extract max price (e.g. "under R500", "below 300", "less than R200")
  const priceMatch = lower.match(/(?:under|below|less\s+than|max|r|<)\s*r?\s*(\d+)/);
  if (priceMatch) {
    result.maxPrice = parseInt(priceMatch[1], 10);
  }

  // Extract min price (e.g. "over R100", "above 200")
  const minPriceMatch = lower.match(/(?:over|above|more\s+than|at\s+least)\s*r?\s*(\d+)/);
  if (minPriceMatch) {
    result.minPrice = parseInt(minPriceMatch[1], 10);
  }

  // Extract colours
  const foundColours: string[] = [];
  for (const colour of COLOUR_KEYWORDS) {
    if (lower.includes(colour)) {
      if (colour === 'dark') {
        foundColours.push('black', 'navy', 'grey', 'olive', 'maroon');
      } else if (colour === 'light') {
        foundColours.push('white', 'cream', 'beige', 'yellow');
      } else {
        foundColours.push(colour);
      }
    }
  }
  if (foundColours.length > 0) {
    result.colours = [...new Set(foundColours)];
  }

  // Detect category
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      result.category = cat;
      break;
    }
  }

  // Remaining terms (remove price/colour tokens, use as search terms)
  const cleaned = query
    .replace(/(?:under|below|less\s+than|over|above|more\s+than|at\s+least)\s*r?\s*\d+/gi, '')
    .replace(/\b(?:affordable|cheap|budget|expensive|dark|light|colours?)\b/gi, '')
    .trim();

  result.searchTerms = cleaned
    .split(/\s+/)
    .filter((t) => t.length > 2);

  return result;
}

export async function parseQueryWithGemini(query: string): Promise<ParsedQuery> {
  try {
    const response = await fetch('/api/parse-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    return data as ParsedQuery;
  } catch {
    // Fall back to local parser
    return parseQueryLocally(query);
  }
}
