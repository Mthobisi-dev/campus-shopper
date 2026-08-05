'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { INTERESTS, DURBAN_SUBURBS, SUBURB_COORDS, COLOURS } from '@/types';
import { formatZAR } from '@/lib/utils';
import {
  Settings, Save, LogOut, Loader2, Check, MapPin, Wallet, Heart, User,
  Bot, Sparkles, Sliders, ShieldCheck, HelpCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notifyBudgetUpdated } from '@/lib/userSession';

const COLOUR_HEX: Record<string, string> = {
  black: '#000000', white: '#f8fafc', grey: '#6b7280', navy: '#1e3a5f',
  blue: '#3b82f6', red: '#ef4444', green: '#22c55e', olive: '#6b7028',
  yellow: '#eab308', pink: '#ec4899', orange: '#f97316', purple: '#a855f7',
  maroon: '#7f1d1d', burgundy: '#6b1f2e', khaki: '#c3b082', silver: '#d1d5db',
  gold: '#f59e0b', brown: '#92400e',
};

export default function PreferencesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'budget' | 'style' | 'ai_survey' | 'account'>('profile');

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [university, setUniversity] = useState('Durban University of Technology');
  const [suburb, setSuburb] = useState('Glenwood');
  const [monthlyBudget, setMonthlyBudget] = useState<number | string>(1500);
  const [budgetResetDay, setBudgetResetDay] = useState(1);

  // Style Preferences
  const [interests, setInterests] = useState<string[]>([]);
  const [favColours, setFavColours] = useState<string[]>([]);
  const [favSizes, setFavSizes] = useState<string[]>([]);
  const [maxShipping, setMaxShipping] = useState<number | string>(100);
  const [maxDistance, setMaxDistance] = useState<number | string>(50);

  // AI Persona Survey fields
  const [spendingFocus, setSpendingFocus] = useState('Groceries & Study Supplies');
  const [shoppingVibe, setShoppingVibe] = useState('Best Value & Local Bargains');
  const [styleDietary, setStyleDietary] = useState('Casual Streetwear & Easy Prep Food');
  const [budgetStrictness, setBudgetStrictness] = useState('Strict Warning when near limit');
  const [customNotes, setCustomNotes] = useState('');

  const [aiPersonaSummary, setAiPersonaSummary] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [trainingAi, setTrainingAi] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Try fetching via /api/profile endpoint for resilient fallback
      const res = await fetch(`/api/profile?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const prof = data.profile;
        const prefs = data.preferences;

        if (prof) {
          setDisplayName(prof.display_name || user.email?.split('@')[0] || 'DUT Student');
          setStudentNumber(prof.student_number || 'DUT-2026-001');
          setUniversity(prof.university || 'Durban University of Technology');
          setSuburb(prof.suburb || 'Glenwood');
          setMonthlyBudget(prof.monthly_budget_zar !== undefined ? prof.monthly_budget_zar : 1500);
          setBudgetResetDay(prof.budget_reset_day || 1);
        }
        if (prefs) {
          setInterests(prefs.interests || ['tech', 'cooking']);
          setFavColours(prefs.fav_colours || ['black', 'navy']);
          setFavSizes(prefs.fav_sizes || ['M']);
          setMaxShipping(prefs.max_shipping_zar !== undefined ? prefs.max_shipping_zar : 100);
          setMaxDistance(prefs.max_distance_km !== undefined ? prefs.max_distance_km : 50);
          if (prefs.ai_persona_summary) setAiPersonaSummary(prefs.ai_persona_summary);
        }
      }
    } catch (err) {
      console.warn('Load data fallback:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const coords = SUBURB_COORDS[suburb] || { lat: -29.8650, lng: 30.9822 };
    const numBudget = parseFloat(monthlyBudget.toString()) || 1500;
    const numShipping = parseFloat(maxShipping.toString()) || 100;
    const numDistance = parseFloat(maxDistance.toString()) || 50;

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profile: {
            display_name: displayName,
            student_number: studentNumber,
            university,
            suburb,
            lat: coords.lat,
            lng: coords.lng,
            monthly_budget_zar: numBudget,
            budget_reset_day: budgetResetDay,
          },
          preferences: {
            interests,
            fav_colours: favColours,
            fav_sizes: favSizes,
            max_shipping_zar: numShipping,
            max_distance_km: numDistance,
            ai_persona_summary: aiPersonaSummary,
          },
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      notifyBudgetUpdated(numBudget);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTrainAi() {
    setTrainingAi(true);
    try {
      const res = await fetch('/api/ai-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            spendingFocus,
            shoppingVibe,
            styleDietary,
            budgetStrictness,
            customNotes,
          },
          profile: {
            display_name: displayName,
            university,
            suburb,
            monthly_budget_zar: monthlyBudget,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiPersonaSummary(data.ai_persona_summary);
        setAiTip(data.ai_tip);
        // Automatically save AI persona
        handleSave();
      }
    } catch (err) {
      console.error('AI Survey failed:', err);
    } finally {
      setTrainingAi(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  function toggleInterest(val: string) {
    setInterests((prev) => prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]);
  }
  function toggleColour(val: string) {
    setFavColours((prev) => prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]);
  }
  function toggleSize(val: string) {
    setFavSizes((prev) => prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]);
  }

  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'];

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'budget', label: 'Budget', icon: Wallet },
    { key: 'style', label: 'Style', icon: Heart },
    { key: 'ai_survey', label: '🤖 AI Survey', icon: Bot },
    { key: 'account', label: 'Account', icon: Settings },
  ] as const;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Preferences & Profile</h1>
            <p className="text-sm text-muted-foreground">DUT Student Account & AI Persona Settings</p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save</>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`pref-tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === key ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {/* ── TAB 1: PROFILE ───────────────────────────────────── */}
        {activeTab === 'profile' && (
          <>
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2 text-base"><User className="w-4 h-4 text-primary" /> Personal Info</h2>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Display Name</label>
                <input
                  id="pref-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sipho Ndlovu"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Student Number</label>
                <input
                  id="pref-student-number"
                  type="text"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="e.g. 21984710"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">University</label>
                <input
                  id="pref-university"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="input-field bg-secondary/50 font-medium"
                />
              </div>
            </div>

            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2 text-base"><MapPin className="w-4 h-4 text-green-400" /> Location & Radius</h2>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Your Suburb in Durban</label>
                <select
                  id="pref-suburb"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="input-field"
                >
                  {DURBAN_SUBURBS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Used to calculate distance to nearest stores & vendors</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Distance to Vendor</label>
                  <span className="text-sm font-bold text-primary">{maxDistance} km</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 rounded-lg bg-secondary cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                    className="w-20 input-field text-center font-bold text-sm"
                  />
                  <span className="text-xs text-muted-foreground">km</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: BUDGET ────────────────────────────────────── */}
        {activeTab === 'budget' && (
          <div className="glass-card p-5 space-y-5">
            <h2 className="font-semibold flex items-center gap-2 text-base"><Wallet className="w-4 h-4 text-green-400" /> Monthly Budget Settings</h2>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Monthly Budget (ZAR) — Supports Odd & Even amounts
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R</span>
                <input
                  id="pref-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="1500.00"
                  className="input-field pl-8 font-bold text-lg text-green-400"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Set any exact value, e.g. R1347.50 or R1500</p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Quick Presets</label>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 1347, 1500, 2500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyBudget(amt)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      Number(monthlyBudget) === amt
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    R{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Budget Reset Day of Month
              </label>
              <select
                value={budgetResetDay}
                onChange={(e) => setBudgetResetDay(Number(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Day {d} of every month</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── TAB 3: STYLE PREFERENCES ──────────────────────────── */}
        {activeTab === 'style' && (
          <>
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-base">Student Interests</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTERESTS.map((item) => {
                  const sel = interests.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggleInterest(item.value)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        sel
                          ? 'bg-primary/20 border-primary text-primary font-semibold'
                          : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-base">Preferred Colours & Sizes</h2>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Colours</label>
                <div className="flex flex-wrap gap-2">
                  {COLOURS.map((c) => {
                    const sel = favColours.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleColour(c)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          sel
                            ? 'bg-primary/20 border-primary text-primary font-bold'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: COLOUR_HEX[c] || '#888' }} />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Clothing & Shoe Sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((s) => {
                    const sel = favSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          sel
                            ? 'bg-primary/20 border-primary text-primary font-bold'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 4: 🤖 AI SURVEY ("Train AI") ───────────────────── */}
        {activeTab === 'ai_survey' && (
          <div className="glass-card p-5 space-y-5 border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Train Your AI Shopping Assistant</h2>
                <p className="text-xs text-muted-foreground">Tell AI your shopping preferences so it recommends the best deals for you</p>
              </div>
            </div>

            {/* AI Summary Banner if present */}
            {aiPersonaSummary && (
              <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border border-blue-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-yellow-400" /> Trained AI Persona
                </div>
                <p className="text-sm text-foreground leading-relaxed">{aiPersonaSummary}</p>
                {aiTip && (
                  <p className="text-xs text-yellow-300/90 pt-1 border-t border-blue-500/20">{aiTip}</p>
                )}
              </div>
            )}

            {/* Survey Questions */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  1. What is your main student spending focus?
                </label>
                <select
                  value={spendingFocus}
                  onChange={(e) => setSpendingFocus(e.target.value)}
                  className="input-field"
                >
                  <option value="Groceries & Cooking">🛒 Groceries & Meal Prep</option>
                  <option value="Textbooks & Study Supplies">📚 Textbooks & Study Supplies</option>
                  <option value="Fashion & Streetwear">👕 Fashion & Campus Apparel</option>
                  <option value="Tech & Electronics">💻 Tech & Study Gadgets</option>
                  <option value="Gym & Fitness Health">🏋️ Gym, Protein & Health</option>
                  <option value="Data & Airtime Bundles">📱 Data & Airtime Bundles</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  2. What is your preferred shopping vibe?
                </label>
                <select
                  value={shoppingVibe}
                  onChange={(e) => setShoppingVibe(e.target.value)}
                  className="input-field"
                >
                  <option value="Best Value & Local Bargains">🏷️ Lowest Price Bargains First</option>
                  <option value="Quality & Trusted Brands">⭐ Trusted Premium Brands</option>
                  <option value="Fastest Nearby Durban Shops">📍 Nearest Local Durban Stores</option>
                  <option value="Free Delivery Only">🚚 Free Shipping Focus</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  3. Personal Style, Brands, or Dietary Habits
                </label>
                <input
                  type="text"
                  value={styleDietary}
                  onChange={(e) => setStyleDietary(e.target.value)}
                  placeholder="e.g. Vegetarian, Nike fan, Casual hoodies, Halal snacks"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  4. How strictly should AI enforce your budget?
                </label>
                <select
                  value={budgetStrictness}
                  onChange={(e) => setBudgetStrictness(e.target.value)}
                  className="input-field"
                >
                  <option value="Strict Warning when near limit">🔴 Strict — Highlight and block over-budget items</option>
                  <option value="Flexible Suggestion">🟡 Flexible — Warn but allow best-value purchases</option>
                  <option value="Relaxed Advisor">🟢 Relaxed — Focus on quality deals first</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  5. Additional Notes for your AI Assistant
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. I prefer shopping near Musgrave and Glenwood on weekends..."
                  className="input-field resize-none"
                />
              </div>
            </div>

            {/* Submit Survey button */}
            <button
              onClick={handleTrainAi}
              disabled={trainingAi}
              className="w-full py-3 rounded-xl btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              {trainingAi ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Training AI Persona with Gemini...</>
              ) : (
                <><Sparkles className="w-4 h-4 text-yellow-300" /> Train & Update AI Persona</>
              )}
            </button>
          </div>
        )}

        {/* ── TAB 5: ACCOUNT ───────────────────────────────────── */}
        {activeTab === 'account' && (
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Account Actions</h2>
            <div className="pt-2">
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
