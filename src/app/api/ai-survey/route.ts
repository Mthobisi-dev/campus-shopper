import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, profile } = body;

    const prompt = `You are an AI Shopping Assistant for South African university students at Durban University of Technology (DUT).
Analyze the student's survey responses and profile to generate a concise, personalized AI Recommendation Persona (2-3 sentences max).

Student Info:
- Name: ${profile?.display_name || 'DUT Student'}
- University: ${profile?.university || 'Durban University of Technology'}
- Durban Suburb: ${profile?.suburb || 'Glenwood'}
- Monthly Budget: R${profile?.monthly_budget_zar || 1500}

Survey Answers:
1. Spending Priority: ${answers.spendingFocus || 'Groceries & Study Supplies'}
2. Shopping Style: ${answers.shoppingVibe || 'Value & Local Bargains'}
3. Style / Dietary / Brand Habits: ${answers.styleDietary || 'Standard Student'}
4. Budget Strictness: ${answers.budgetStrictness || 'Strict Monthly Cap'}
5. Additional Notes: ${answers.customNotes || 'None'}

Return ONLY a valid JSON object (no markdown formatting) with these exact keys:
{
  "ai_persona_summary": "A 2-3 sentence persona summary of the student's shopping archetype and budget style in Durban.",
  "recommended_categories": ["array", "of", "categories"],
  "fav_keywords": ["keyword1", "keyword2", "keyword3"],
  "ai_tip": "A short, helpful tip for this student on how to stretch their budget in Durban."
}`;

    let aiPersonaSummary = '';
    let aiTip = '';
    let favKeywords: string[] = [];

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      aiPersonaSummary = parsed.ai_persona_summary || '';
      aiTip = parsed.ai_tip || '';
      favKeywords = parsed.fav_keywords || [];
    } catch (err) {
      console.warn('Gemini API call failed, generating local AI persona fallback:', err);
      aiPersonaSummary = `DUT student based in ${profile?.suburb || 'Glenwood'} with a monthly budget of R${profile?.monthly_budget_zar || 1500}. Focused on ${answers.spendingFocus || 'essentials'} with a ${answers.shoppingVibe || 'value-conscious'} shopping style.`;
      aiTip = `Tip: Check local vendors in ${profile?.suburb || 'Glenwood'} and Durban CBD to save on shipping costs!`;
      favKeywords = (answers.spendingFocus || 'groceries,textbooks').toLowerCase().split(/[,\s]+/);
    }

    return NextResponse.json({
      success: true,
      ai_persona_summary: aiPersonaSummary,
      ai_tip: aiTip,
      fav_keywords: favKeywords,
    });
  } catch (err: any) {
    console.error('Error processing AI survey:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
