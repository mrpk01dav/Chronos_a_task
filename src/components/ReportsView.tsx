import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  Award, 
  FileText, 
  Filter, 
  Printer, 
  Copy, 
  Check, 
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { CategoryItem, Goal, Priority, Task } from '../types';
import { StorageService } from '../services/storage';

interface ReportsViewProps {
  tasks: Task[];
  categories: CategoryItem[];
  goals: Goal[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'history';

export const ReportsView: React.FC<ReportsViewProps> = ({ tasks, categories, goals }) => {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [comparePrevious, setComparePrevious] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const todayStr = new Date().toISOString().split('T')[0];

  // Base filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterCategory, filterPriority]);

  // Daily Stats (Today)
  const dailyStats = useMemo(() => {
    const todayTasks = filteredTasks.filter((t) => t.dueDate === todayStr);
    const completed = todayTasks.filter((t) => t.completed);
    const pending = todayTasks.filter((t) => !t.completed);
    const overdue = filteredTasks.filter((t) => !t.completed && t.dueDate < todayStr);
    const onTimeCompleted = completed.filter((t) => {
      if (!t.completedAt) return true;
      const compDate = t.completedAt.split('T')[0];
      return compDate <= t.dueDate;
    });
    const missedDeadlines = overdue.length;
    const rate = todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 100;

    return {
      total: todayTasks.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      onTimeCompleted: onTimeCompleted.length,
      missedDeadlines,
      rate,
    };
  }, [filteredTasks, todayStr]);

  // Weekly Stats (Last 7 Days)
  const weeklyStats = useMemo(() => {
    const days: Array<{ label: string; dateStr: string; created: number; completed: number }> = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayTasks = filteredTasks.filter((t) => t.dueDate === str);
      const dayCompleted = dayTasks.filter((t) => t.completed).length;

      days.push({
        label: dayLabel,
        dateStr: str,
        created: dayTasks.length,
        completed: dayCompleted,
      });
    }

    const totalCreated = days.reduce((acc, d) => acc + d.created, 0);
    const totalCompleted = days.reduce((acc, d) => acc + d.completed, 0);
    const rate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    // Find best & least productive day
    let bestDay = days[0];
    let leastDay = days[0];
    for (const d of days) {
      if (d.completed > bestDay.completed) bestDay = d;
      if (d.completed < leastDay.completed) leastDay = d;
    }

    const carriedForward = filteredTasks.filter((t) => !t.completed && t.dueDate < todayStr).length;

    return {
      days,
      totalCreated,
      totalCompleted,
      rate,
      bestDay,
      leastDay,
      carriedForward,
    };
  }, [filteredTasks, todayStr]);

  // Monthly Stats (Last 4 Weeks)
  const monthlyStats = useMemo(() => {
    // 4 weeks buckets
    const weeks: Array<{ label: string; created: number; completed: number }> = [
      { label: 'Week 1', created: 0, completed: 0 },
      { label: 'Week 2', created: 0, completed: 0 },
      { label: 'Week 3', created: 0, completed: 0 },
      { label: 'Week 4', created: 0, completed: 0 },
    ];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthTasks = filteredTasks.filter((t) => t.dueDate >= thirtyDaysAgo);

    monthTasks.forEach((t) => {
      const [y, m, d] = t.dueDate.split('-').map(Number);
      const day = d;
      let wIdx = Math.min(3, Math.floor((day - 1) / 7));
      weeks[wIdx].created++;
      if (t.completed) weeks[wIdx].completed++;
    });

    const totalMonth = monthTasks.length;
    const completedMonth = monthTasks.filter((t) => t.completed).length;
    const rate = totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0;

    return {
      weeks,
      totalMonth,
      completedMonth,
      rate,
    };
  }, [filteredTasks]);

  // Yearly Stats (12 months of current year)
  const yearlyStats = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthData = months.map((m, idx) => {
      const pad = (idx + 1).toString().padStart(2, '0');
      const prefix = `${currentYear}-${pad}`;
      const yearTasks = filteredTasks.filter((t) => t.dueDate.startsWith(prefix));
      const completed = yearTasks.filter((t) => t.completed).length;
      return {
        label: m,
        created: yearTasks.length,
        completed,
      };
    });

    const totalYear = monthData.reduce((acc, m) => acc + m.created, 0);
    const completedYear = monthData.reduce((acc, m) => acc + m.completed, 0);
    const avgRate = totalYear > 0 ? Math.round((completedYear / totalYear) * 100) : 0;

    let peakMonth = monthData[0];
    for (const m of monthData) {
      if (m.completed > peakMonth.completed) peakMonth = m;
    }

    return {
      monthData,
      totalYear,
      completedYear,
      avgRate,
      peakMonth,
    };
  }, [filteredTasks]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, { total: number; completed: number }>();
    for (const t of filteredTasks) {
      const cur = counts.get(t.categoryId) || { total: 0, completed: 0 };
      cur.total++;
      if (t.completed) cur.completed++;
      counts.set(t.categoryId, cur);
    }

    return Array.from(counts.entries()).map(([catId, stats]) => {
      const cat = categoryMap.get(catId);
      return {
        id: catId,
        name: cat ? cat.name : catId,
        color: cat ? cat.color : '#6366F1',
        total: stats.total,
        completed: stats.completed,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      };
    });
  }, [filteredTasks, categoryMap]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const csvContent = StorageService.exportTasksToCSV(filteredTasks, categories);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_report_${period}_${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Productivity Summary
  const handleShareSummary = () => {
    let text = `🚀 Chronos Productivity Report (${period.toUpperCase()} - ${todayStr})\n`;
    if (period === 'daily') {
      text += `• Total Tasks: ${dailyStats.total}\n• Completed: ${dailyStats.completed} (${dailyStats.rate}%)\n• Pending: ${dailyStats.pending}\n• Overdue: ${dailyStats.overdue}\n• On-time completion: ${dailyStats.onTimeCompleted}\n`;
    } else if (period === 'weekly') {
      text += `• Weekly Tasks: ${weeklyStats.totalCreated}\n• Completed: ${weeklyStats.totalCompleted} (${weeklyStats.rate}%)\n• Best Day: ${weeklyStats.bestDay.label} (${weeklyStats.bestDay.completed} completed)\n• Carried Forward: ${weeklyStats.carriedForward}\n`;
    } else {
      text += `• Total Tasks: ${monthlyStats.totalMonth}\n• Completed: ${monthlyStats.completedMonth} (${monthlyStats.rate}%)\n`;
    }
    text += `\nTracked with Chronos Task Tracker & Reminders.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const maxWeeklyBar = Math.max(...weeklyStats.days.map((d) => Math.max(d.created, d.completed, 1)));

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Productivity Reports
          </h1>
          <p className="text-xs text-slate-400">
            Comprehensive analytics, completion rates & historical trends
          </p>
        </div>

        {/* Actions (Export CSV, Share, Print) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141624] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Copy formatted summary"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Copied!' : 'Share Summary'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold transition cursor-pointer"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-xl bg-[#141624] border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Print / Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#121420] rounded-2xl border border-white/5 text-xs overflow-x-auto">
        {(['daily', 'weekly', 'monthly', 'yearly', 'history'] as ReportPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold capitalize transition whitespace-nowrap ${
              period === p
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p === 'history' ? 'Task History' : `${p} Report`}
          </button>
        ))}
      </div>

      {/* Category & Priority Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#121420] border border-white/5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Filter Reports:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#181a29] border border-white/10 text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#181a29] border border-white/10 text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <button
          onClick={() => setComparePrevious(!comparePrevious)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
            comparePrevious
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
              : 'bg-[#181a29] text-slate-400 border-white/5 hover:text-white'
          }`}
        >
          {comparePrevious ? '✓ Comparing Previous Period' : 'Compare Previous Period'}
        </button>
      </div>

      {/* DAILY REPORT CONTENT */}
      {period === 'daily' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Planned Today</span>
              <span className="text-2xl font-bold font-mono text-white">{dailyStats.total}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Scheduled</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Completed</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{dailyStats.completed}</span>
              <span className="text-[10px] text-emerald-400/80 block mt-1">
                {dailyStats.rate}% completion rate
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Completed On Time</span>
              <span className="text-2xl font-bold font-mono text-indigo-400">{dailyStats.onTimeCompleted}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Met deadline</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Missed Deadlines</span>
              <span className={`text-2xl font-bold font-mono ${dailyStats.missedDeadlines > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {dailyStats.missedDeadlines}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Carried forward</span>
            </div>
          </div>

          {/* Productivity progress bar card */}
          <div className="p-4 rounded-2xl bg-[#121420] border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Daily Productivity Target</span>
              <span className="font-mono text-indigo-400 font-bold">{dailyStats.rate}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${dailyStats.rate}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dailyStats.rate >= 80 
                ? '🌟 Outstanding daily focus! You have achieved peak efficiency today.' 
                : 'Steady progress wins the race. Focus on completing one more task before wrapping up your day.'}
            </p>
          </div>
        </div>
      )}

      {/* WEEKLY REPORT CONTENT */}
      {period === 'weekly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Total Created</span>
              <span className="text-2xl font-bold font-mono text-white">{weeklyStats.totalCreated}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Last 7 days</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Total Completed</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{weeklyStats.totalCompleted}</span>
              <span className="text-[10px] text-emerald-400/80 block mt-1">{weeklyStats.rate}% weekly rate</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Best Day</span>
              <span className="text-xl font-bold text-indigo-300">{weeklyStats.bestDay.label}</span>
              <span className="text-[10px] text-slate-400 block mt-1">{weeklyStats.bestDay.completed} tasks crushed</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Carried Forward</span>
              <span className="text-2xl font-bold font-mono text-amber-300">{weeklyStats.carriedForward}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Pending backlog</span>
            </div>
          </div>

          {/* Day-by-Day SVG Bar Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121420] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Day-by-Day Completion Velocity</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                  <span className="text-slate-400">Created</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
                  <span className="text-slate-400">Completed</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4 border-b border-white/10">
              {weeklyStats.days.map((d) => {
                const createdHeight = Math.round((d.created / maxWeeklyBar) * 120);
                const compHeight = Math.round((d.completed / maxWeeklyBar) * 120);

                return (
                  <div key={d.dateStr} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="flex items-end gap-1 w-full justify-center">
                      {/* Created bar */}
                      <div
                        className="w-3 sm:w-4 bg-indigo-500/50 rounded-t transition-all group-hover:bg-indigo-500"
                        style={{ height: `${Math.max(4, createdHeight)}px` }}
                        title={`${d.created} tasks created`}
                      />
                      {/* Completed bar */}
                      <div
                        className="w-3 sm:w-4 bg-emerald-400 rounded-t transition-all shadow-sm shadow-emerald-400/20"
                        style={{ height: `${Math.max(4, compHeight)}px` }}
                        title={`${d.completed} tasks completed`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 mt-2">
                      {d.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {d.completed}/{d.created}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT CONTENT */}
      {period === 'monthly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Monthly Created</span>
              <span className="text-2xl font-bold font-mono text-white">{monthlyStats.totalMonth}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Monthly Completed</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{monthlyStats.completedMonth}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Completion Rate</span>
              <span className="text-2xl font-bold font-mono text-indigo-400">{monthlyStats.rate}%</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121420] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">Week-by-Week Progress</h3>
            <div className="space-y-2.5">
              {monthlyStats.weeks.map((w) => {
                const wRate = w.created > 0 ? Math.round((w.completed / w.created) * 100) : 0;
                return (
                  <div key={w.label} className="p-2.5 rounded-xl bg-[#181a29] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{w.label}</span>
                      <span className="font-mono text-indigo-300">
                        {w.completed}/{w.created} completed ({wRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${wRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* YEARLY REPORT CONTENT */}
      {period === 'yearly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Yearly Total</span>
              <span className="text-2xl font-bold font-mono text-white">{yearlyStats.totalYear}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Yearly Accomplished</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{yearlyStats.completedYear}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Peak Month</span>
              <span className="text-xl font-bold text-indigo-300">{yearlyStats.peakMonth.label}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121420] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">Month-by-Month Activity</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              {yearlyStats.monthData.map((m) => (
                <div key={m.label} className="p-2.5 rounded-xl bg-[#181a29] border border-white/5 text-center">
                  <span className="font-bold text-white block">{m.label}</span>
                  <span className="text-indigo-400 font-mono text-[11px] block mt-1">
                    {m.completed}/{m.created}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TASK HISTORY VIEW */}
      {period === 'history' && (
        <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Complete Task Audit Log & History ({filteredTasks.length} records)</span>
          </h3>
          <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto pr-1 text-xs">
            {filteredTasks.map((t) => {
              const cat = categoryMap.get(t.categoryId);
              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className={`font-semibold block truncate ${t.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {t.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                      <span>·</span>
                      <span>Due {t.dueDate} {t.dueTime}</span>
                      <span>·</span>
                      <span className="capitalize">{t.priority} priority</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    t.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category-Wise Breakdown Section */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          <span>Category-Wise Task Distribution</span>
        </h3>

        <div className="space-y-2.5">
          {categoryBreakdown.map((cat) => (
            <div key={cat.id} className="p-3 rounded-xl bg-[#181a29] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-white">{cat.name}</span>
                </div>
                <span className="font-mono text-slate-300">
                  {cat.completed}/{cat.total} completed ({cat.rate}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: cat.color,
                    width: `${cat.rate}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
