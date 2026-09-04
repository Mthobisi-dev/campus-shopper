'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Wallet, Save, Loader2, CheckCircle2,
  GraduationCap, MapPin, Calendar, ShoppingBag,
  TrendingUp, AlertTriangle, User, Edit3,
} from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  student_number: string;
  university: string;
  suburb: string;
  monthly_budget_zar: number;
  budget_reset_day: number;
  created_at: string;
  updated_at: string;
}

interface Purchase {
  id: string;
  product_name: string;
  category: string;
  total_zar: number;
  purchased_at: string;
  vendor_name: string;
}

export default function AdminStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Editable admin fields
  const [newBudget, setNewBudget] = useState('');
  const [resetDay, setResetDay] = useState(1);
  const [editMode, setEditMode] = useState(false);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/students/${studentId}`);
    if (res.status === 403) { router.push('/admin/login'); return; }
    if (res.status === 404) { router.push('/admin/dashboard'); return; }
    const data = await res.json();
    setProfile(data.profile);
    setPurchases(data.purchases || []);
    setNewBudget(String(data.profile?.monthly_budget_zar || 1500));
    setResetDay(data.profile?.budget_reset_day || 1);
    setLoading(false);
  }, [studentId, router]);

  useEffect(() => { loadStudent(); }, [loadStudent]);

  async function handleSave() {
    setSaving(true);
    setError('');

    const budget = parseFloat(newBudget);
    if (isNaN(budget) || budget <= 0) {
      setError('Please enter a valid budget amount greater than R0.');
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_budget_zar: budget, budget_reset_day: resetDay }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to update student.');
      setSaving(false);
      return;
    }

    setProfile(data.profile);
    setEditMode(false);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  function formatZAR(n: number) {
    return `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  const spent = purchases
    .filter(p => {
      const start = new Date();
      start.setDate(resetDay);
      start.setHours(0, 0, 0, 0);
      if (start > new Date()) start.setMonth(start.getMonth() - 1);
      return new Date(p.purchased_at) >= start;
    })
    .reduce((s, p) => s + Number(p.total_zar), 0);

  const remaining = Number(profile?.monthly_budget_zar || 0) - spent;
  const pct = Number(profile?.monthly_budget_zar) > 0
    ? Math.min(1, spent / Number(profile?.monthly_budget_zar))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading student...
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.display_name || 'Student'}</h1>
          <p className="text-gray-500 text-sm font-mono">{profile.student_number || 'No student number'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-xl font-bold text-white">
                {(profile.display_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white">{profile.display_name}</p>
                <p className="text-xs text-gray-500">Student Account</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <GraduationCap className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span>{profile.university || 'University not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span>{profile.suburb || 'Suburb not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString('en-ZA')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <ShoppingBag className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span>{purchases.length} total purchases</span>
              </div>
            </div>
          </div>

          {/* Budget bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              This Month
            </h3>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${pct >= 1 ? 'bg-red-500' : pct >= 0.8 ? 'bg-orange-500' : 'bg-green-500'}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-4">
              <span>Spent: <span className="text-orange-400 font-medium">{formatZAR(spent)}</span></span>
              <span>Left: <span className={`font-medium ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatZAR(Math.max(0, remaining))}</span></span>
            </div>
          </div>
        </div>

        {/* Right: Budget editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-500" />
                Budget Management
              </h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {!editMode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Monthly Budget</span>
                  <span className="text-2xl font-bold text-white">{formatZAR(profile.monthly_budget_zar)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Budget Reset Day</span>
                  <span className="text-white font-medium">Day {profile.budget_reset_day} of each month</span>
                </div>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only administrators can modify student budget allowances.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    New Monthly Budget (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R</span>
                    <input
                      id="admin-budget-input"
                      type="number"
                      min="1"
                      max="100000"
                      step="50"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pl-8 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[500, 750, 1000, 1500, 2000, 3000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setNewBudget(String(preset))}
                        className={`px-3 py-1 rounded-lg text-xs transition ${Number(newBudget) === preset ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        R{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Budget Reset Day
                  </label>
                  <select
                    value={resetDay}
                    onChange={(e) => setResetDay(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setError(''); setNewBudget(String(profile.monthly_budget_zar)); }}
                    className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-green-400 bg-green-950/40 border border-green-800 rounded-xl px-4 py-3 mt-4 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Budget updated successfully.
              </div>
            )}
          </div>

          {/* Purchase history */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-400" />
                Purchase History ({purchases.length})
              </h3>
            </div>
            {purchases.length === 0 ? (
              <div className="py-10 text-center text-gray-600 text-sm">No purchases yet</div>
            ) : (
              <div className="divide-y divide-gray-800/50 max-h-64 overflow-y-auto">
                {purchases.slice(0, 20).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-white">{p.product_name}</p>
                      <p className="text-xs text-gray-500">
                        {p.vendor_name} · {new Date(p.purchased_at).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-orange-400">{formatZAR(p.total_zar)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
