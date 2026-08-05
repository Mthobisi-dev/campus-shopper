'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, ShoppingBag, Loader2, GraduationCap } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    studentNumber: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          display_name: form.displayName,
          student_number: form.studentNumber,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Redirect to onboarding to set up budget/location
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/50">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">CampusShopper</h1>
          <p className="text-muted-foreground mt-1">Create your student account</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-6">Get started</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Student Number
                </label>
                <input
                  id="signup-student-number"
                  name="studentNumber"
                  type="text"
                  value={form.studentNumber}
                  onChange={handleChange}
                  placeholder="e.g. 221043210"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Display Name
                </label>
                <input
                  id="signup-display-name"
                  name="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Student Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="studentno@dut4life.ac.za"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                className="input-field"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-1 mt-6 text-sm text-muted-foreground">
          <GraduationCap className="w-4 h-4" />
          <span>Made for DUT students in Durban</span>
        </div>
      </div>
    </div>
  );
}
