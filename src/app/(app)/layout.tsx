import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppNav from '@/components/layout/AppNav';
import BudgetBanner from '@/components/budget/BudgetBanner';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch profile for budget banner
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Calculate spent this month
  const startOfMonth = new Date();
  startOfMonth.setDate(profile?.budget_reset_day || 1);
  startOfMonth.setHours(0, 0, 0, 0);
  if (startOfMonth > new Date()) {
    startOfMonth.setMonth(startOfMonth.getMonth() - 1);
  }

  const { data: monthPurchases } = await supabase
    .from('purchases')
    .select('total_zar')
    .eq('profile_id', user.id)
    .gte('purchased_at', startOfMonth.toISOString());

  const spent = (monthPurchases || []).reduce((sum, p) => sum + Number(p.total_zar), 0);
  const totalBudget = Number(profile?.monthly_budget_zar || 1500);

  return (
    <div className="min-h-screen flex flex-col">
      <BudgetBanner spent={spent} total={totalBudget} />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <AppNav />
    </div>
  );
}
