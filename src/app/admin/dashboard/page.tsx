'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, TrendingUp, Wallet, AlertTriangle,
  ChevronRight, RefreshCw, GraduationCap, CheckCircle2,
} from 'lucide-react';

interface Student {
  id: string;
  student_number: string;
  display_name: string;
  university: string;
  suburb: string;
  monthly_budget_zar: number;
  budget_reset_day: number;
  spent_this_month: number;
  remaining: number;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'spent' | 'remaining'>('name');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/students');
    if (res.status === 403) {
      router.push('/admin/login');
      return;
    }
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    let list = [...students];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.display_name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q) ||
        s.suburb?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return (a.display_name || '').localeCompare(b.display_name || '');
      if (sortBy === 'budget') return b.monthly_budget_zar - a.monthly_budget_zar;
      if (sortBy === 'spent') return b.spent_this_month - a.spent_this_month;
      if (sortBy === 'remaining') return a.remaining - b.remaining;
      return 0;
    });
    setFiltered(list);
  }, [students, search, sortBy]);

  const totalBudget = students.reduce((s, st) => s + Number(st.monthly_budget_zar), 0);
  const totalSpent = students.reduce((s, st) => s + Number(st.spent_this_month), 0);
  const atRisk = students.filter(s => s.remaining < s.monthly_budget_zar * 0.1).length;

  function formatZAR(n: number) {
    return `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  function getBudgetStatus(student: Student) {
    const pct = student.spent_this_month / student.monthly_budget_zar;
    if (pct >= 1) return { label: 'Over Budget', color: 'text-red-400 bg-red-950/50 border-red-800' };
    if (pct >= 0.8) return { label: 'Critical', color: 'text-orange-400 bg-orange-950/50 border-orange-800' };
    if (pct >= 0.5) return { label: 'Moderate', color: 'text-yellow-400 bg-yellow-950/50 border-yellow-800' };
    return { label: 'Healthy', color: 'text-green-400 bg-green-950/50 border-green-800' };
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Accounts</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage budgets and monitor spending</p>
        </div>
        <button
          onClick={loadStudents}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Students', value: students.length.toString(), color: 'from-blue-600 to-blue-700' },
          { icon: Wallet, label: 'Total Budgets', value: formatZAR(totalBudget), color: 'from-purple-600 to-purple-700' },
          { icon: TrendingUp, label: 'Total Spent', value: formatZAR(totalSpent), color: 'from-orange-600 to-orange-700' },
          { icon: AlertTriangle, label: 'At Risk (<10%)', value: atRisk.toString(), color: 'from-red-600 to-red-700' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-xl font-bold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, student number or suburb..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="name">Sort: Name</option>
          <option value="budget">Sort: Budget (High)</option>
          <option value="spent">Sort: Most Spent</option>
          <option value="remaining">Sort: Least Remaining</option>
        </select>
      </div>

      {/* Student Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading students...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Student</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Student #</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Suburb</th>
                  <th className="text-right px-5 py-3 font-medium">Budget</th>
                  <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Spent</th>
                  <th className="text-right px-5 py-3 font-medium">Remaining</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const status = getBudgetStatus(student);
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer"
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {(student.display_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{student.display_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400 hidden md:table-cell font-mono text-xs">
                        {student.student_number || '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">
                        {student.suburb || '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-white font-semibold">
                        {formatZAR(student.monthly_budget_zar)}
                      </td>
                      <td className="px-5 py-4 text-right text-orange-400 hidden sm:table-cell">
                        {formatZAR(student.spent_this_month)}
                      </td>
                      <td className={`px-5 py-4 text-right font-semibold ${student.remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatZAR(Math.max(0, student.remaining))}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-700 text-center">
        {filtered.length} of {students.length} students shown · Spend data resets monthly
      </p>
    </div>
  );
}
