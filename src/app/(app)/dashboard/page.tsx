import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [
        { data: profile },
        { data: preferences },
        { data: purchases },
        { data: favourites },
        { data: recentSearches },
        { data: allProducts },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('preferences').select('*').eq('profile_id', user.id).maybeSingle(),
        supabase.from('purchases').select('*').eq('profile_id', user.id).order('purchased_at', { ascending: false }).limit(100),
        supabase.from('favourites').select('*, product:products(*, vendor:vendors(*))').eq('profile_id', user.id).limit(8),
        supabase.from('searches').select('*').eq('profile_id', user.id).order('searched_at', { ascending: false }).limit(5),
        supabase.from('products').select('*, vendor:vendors(*)').eq('is_active', true).limit(60),
      ]);

      const totalBudget = Number(profile?.monthly_budget_zar || 1500);
      const resetDay = profile?.budget_reset_day || 1;
      const startOfMonth = new Date();
      startOfMonth.setDate(resetDay);
      startOfMonth.setHours(0, 0, 0, 0);
      if (startOfMonth > new Date()) startOfMonth.setMonth(startOfMonth.getMonth() - 1);

      const monthPurchases = (purchases || []).filter(
        (p) => new Date(p.purchased_at) >= startOfMonth
      );
      const spent = monthPurchases.reduce((sum, p) => sum + Number(p.total_zar), 0);
      const remaining = totalBudget - spent;

      const categorySpend: Record<string, number> = {};
      monthPurchases.forEach((p) => {
        categorySpend[p.category] = (categorySpend[p.category] || 0) + Number(p.total_zar);
      });

      return (
        <DashboardClient
          profile={profile}
          preferences={preferences}
          purchases={purchases || []}
          monthPurchases={monthPurchases}
          favourites={favourites || []}
          recentSearches={recentSearches || []}
          allProducts={allProducts || []}
          spent={spent}
          totalBudget={totalBudget}
          remaining={remaining}
          categorySpend={categorySpend}
        />
      );
    }
  } catch (err) {
    console.warn('Dashboard server load fallback:', err);
  }

  // Client-side fallback: DashboardClient will auto-fetch from /api/dashboard
  return <DashboardClient />;
}
