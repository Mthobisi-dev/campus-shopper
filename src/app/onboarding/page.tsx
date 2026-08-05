'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DURBAN_SUBURBS, SUBURB_COORDS, INTERESTS } from '@/types';
import { formatZAR } from '@/lib/utils';
import {
  Wallet, MapPin, Heart, ChevronRight, ChevronLeft,
  GraduationCap, Loader2, Check,
} from 'lucide-react';

const STEPS = ['Budget', 'Location', 'Interests'];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [budget, setBudget] = useState(1500);
  const [resetDay, setResetDay] = useState(1);
  const [suburb, setSuburb] = useState('Glenwood');
  const [interests, setInterests] = useState<string[]>([]);
  const [favColours, setFavColours] = useState<string[]>([]);

  const COLOURS_DISPLAY = [
    { val: 'black', hex: '#000000' },
    { val: 'white', hex: '#ffffff' },
    { val: 'grey', hex: '#6b7280' },
    { val: 'navy', hex: '#1e3a5f' },
    { val: 'blue', hex: '#3b82f6' },
    { val: 'red', hex: '#ef4444' },
    { val: 'green', hex: '#22c55e' },
    { val: 'olive', hex: '#6b7028' },
    { val: 'yellow', hex: '#eab308' },
    { val: 'pink', hex: '#ec4899' },
    { val: 'orange', hex: '#f97316' },
    { val: 'purple', hex: '#a855f7' },
    { val: 'maroon', hex: '#7f1d1d' },
    { val: 'burgundy', hex: '#6b1f2e' },
    { val: 'khaki', hex: '#c3b082' },
  ];

  function toggleInterest(val: string) {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  }

  function toggleColour(val: string) {
    setFavColours((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const coords = SUBURB_COORDS[suburb] || { lat: -29.8650, lng: 30.9822 };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        suburb,
        lat: coords.lat,
        lng: coords.lng,
        monthly_budget_zar: budget,
        budget_reset_day: resetDay,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) { setError(profileError.message); setLoading(false); return; }

    const { error: prefError } = await supabase
      .from('preferences')
      .upsert({
        profile_id: user.id,
        fav_colours: favColours,
        interests,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    if (prefError) { setError(prefError.message); setLoading(false); return; }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-3 shadow-lg shadow-blue-900/50">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set up your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        <div className="glass-card p-8">
          {/* Step 0 — Budget */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Monthly Budget</h2>
                  <p className="text-sm text-muted-foreground">Set your NSFAS or monthly allowance</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Monthly allowance (ZAR)</label>
                  <span className="text-2xl font-bold text-green-400">{formatZAR(budget)}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">R</span>
                  <input
                    id="onboarding-budget-input"
                    type="number"
                    min={0}
                    step="any"
                    value={budget || ''}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    placeholder="Enter amount (odd or even, e.g. 1537)"
                    className="input-field py-2 flex-1 text-lg font-bold text-green-400"
                  />
                </div>
                <input
                  id="onboarding-budget-slider"
                  type="range"
                  min={100}
                  max={10000}
                  step={1}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>R100</span>
                  <span>R10,000</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Budget resets on day
                </label>
                <select
                  id="onboarding-reset-day"
                  value={resetDay}
                  onChange={(e) => setResetDay(Number(e.target.value))}
                  className="input-field"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}{['st','nd','rd'][d-1] || 'th'} of each month
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                💡 NSFAS pays around <strong>R1,500–R6,000/month</strong> for accommodation and living costs. Set your actual amount for accurate tracking.
              </div>
            </div>
          )}

          {/* Step 1 — Location */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Your Location</h2>
                  <p className="text-sm text-muted-foreground">We&apos;ll calculate distance to vendors</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Your suburb / area in Durban
                </label>
                <select
                  id="onboarding-suburb"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="input-field"
                >
                  {DURBAN_SUBURBS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {SUBURB_COORDS[suburb] && (
                <div className="bg-secondary/50 rounded-xl p-4 text-sm space-y-2">
                  <p className="font-medium">{suburb}, Durban</p>
                  <p className="text-muted-foreground text-xs">
                    Lat: {SUBURB_COORDS[suburb].lat.toFixed(4)}, Lng: {SUBURB_COORDS[suburb].lng.toFixed(4)}
                  </p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                📍 We use straight-line distance from your suburb to each vendor to help you find the closest options.
              </div>
            </div>
          )}

          {/* Step 2 — Interests & Colours */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Your Interests</h2>
                  <p className="text-sm text-muted-foreground">Personalise your recommendations</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">Interests (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.value}
                      id={`interest-${interest.value}`}
                      type="button"
                      onClick={() => toggleInterest(interest.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                        interests.includes(interest.value)
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">Favourite colours</label>
                <div className="flex flex-wrap gap-3">
                  {COLOURS_DISPLAY.map((c) => (
                    <button
                      key={c.val}
                      id={`colour-${c.val}`}
                      type="button"
                      title={c.val}
                      onClick={() => toggleColour(c.val)}
                      className="relative"
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          favColours.includes(c.val)
                            ? 'border-primary scale-110 ring-2 ring-primary/50'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                      {favColours.includes(c.val) && (
                        <Check
                          className="absolute inset-0 m-auto w-4 h-4 drop-shadow"
                          style={{ color: c.val === 'white' || c.val === 'yellow' ? '#000' : '#fff' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3 mt-4">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                id="onboarding-back"
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              id={step < STEPS.length - 1 ? 'onboarding-next' : 'onboarding-finish'}
              type="button"
              onClick={step < STEPS.length - 1 ? () => setStep((s) => s + 1) : handleFinish}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : step < STEPS.length - 1 ? (
                <>Next <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Start Shopping! <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
