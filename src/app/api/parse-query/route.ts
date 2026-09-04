import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseQueryLocally } from '@/lib/nlParser';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  let query = '';
  try {
    const body = await req.json();
    query = body.query || '';

    if (!query) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a shopping assistant for South African university students.
Parse this shopping query and extract structured filters as JSON.

Query: "${query}"

Return ONLY valid JSON (no markdown) with these optional fields:
{
  "searchTerms": ["list", "of", "key", "words"],
  "category": one of "groceries" | "textbooks" | "clothing" | "toiletries" | "electronics" | "data" | null,
  "maxPrice": number in ZAR or null,
  "minPrice": number in ZAR or null,
  "colours": ["colour names"] or [],
  "sizes": ["S","M","L"] or []
}

Rules:
- "dark colours" → colours: ["black","navy","grey","olive","maroon"]
- "light colours" → colours: ["white","cream","beige","yellow"]
- "affordable"/"cheap"/"budget" → maxPrice: 300
- Prices in South African Rand (ZAR)
- Return raw JSON only, no markdown fences`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Gemini parse error, using local fallback:', err);
    return NextResponse.json(parseQueryLocally(query));
  }
}
