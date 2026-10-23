import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Pin, 
  Check, 
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { CategoryItem, Goal, Task, UserPreferences } from '../types';
import { localDateKey, isTaskOverdue, calculateRealStreak, offsetLocalDate } from '../utils/dateUtils';

interface DashboardViewProps {
  tasks: Task[];
  categories: CategoryItem[];
  preferences: UserPreferences;
  goals: Goal[];
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onQuickAdd: () => void;
  onNavigateToTab: (tab: 'tasks' | 'calendar' | 'reports') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  categories,
  preferences,
  goals,
  onToggleComplete,
  onEditTask,
  onQuickAdd,
  onNavigateToTab,
}) => {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Date strings
  const todayStr = localDateKey();

  // Streak calculation
  const computedStreak = useMemo(() => calculateRealStreak(tasks), [tasks]);

  // Calculations
  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayStr), [tasks, todayStr]);
  const completedToday = useMemo(() => todayTasks.filter((t) => t.completed), [todayTasks]);
  const pendingToday = useMemo(() => todayTasks.filter((t) => !t.completed), [todayTasks]);
  const overdueTasks = useMemo(() => tasks.filter((t) => isTaskOverdue(t)), [tasks]);

  const todayCompletionRate = todayTasks.length > 0 
    ? Math.round((completedToday.length / todayTasks.length) * 100) 
    : 100;

  // High priority tasks
  const highPriorityTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.priority === 'high')
      .slice(0, 3);
  }, [tasks]);

  // Upcoming deadlines (next 7 days, excluding today)
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.dueDate > todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [tasks, todayStr]);

  const overdueCount = overdueTasks.length;

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted date string
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Supportive productivity message
  const productivityInsight = useMemo(() => {
    if (todayTasks.length === 0) {
      return 'Clean slate today! Plan a couple of focused milestones to set your pace.';
    }
    if (todayCompletionRate === 100) {
      return 'Spectacular job! You completed 100% of today’s targets. Take time to relax and recharge.';
    }
    if (todayCompletionRate >= 60) {
      return 'Great progress! More than halfway through your day. Keep the steady cadence going.';
    }
    if (overdueCount > 0) {
      return 'Remember: progress over perfection. Tackling even one overdue item will give you instant momentum.';
    }
    return 'One step at a time. Pick your most important high-priority task and dive in!';
  }, [todayTasks.length, todayCompletionRate, overdueCount]);

  // SVG circular progress parameters
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayCompletionRate / 100) * circumference;

  return (
    <div className="space-y-5 pb-32">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131627] via-[#10121f] to-[#0c0d16] border border-white/10 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono tracking-wider uppercase mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {greeting}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              {productivityInsight}
            </p>
          </div>

          {/* Quick Circular Progress Ring */}
          <div className="flex items-center gap-4 shrink-0 bg-[#16192b]/80 border border-white/5 rounded-2xl p-3.5">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#1e2238"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-white font-mono">{todayCompletionRate}%</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Today</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white text-sm">{completedToday.length}</span>
                <span className="text-slate-500"> / {todayTasks.length} Done</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {pendingToday.length} pending today
              </div>
              <button
                onClick={onQuickAdd}
                className="mt-1 flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div 
          onClick={() => onNavigateToTab('tasks')}
          className="rounded-2xl bg-[#141624] border border-white/5 p-3.5 hover:border-indigo-500/30 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Today's Total</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{todayTasks.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Scheduled for today</div>
        </div>

        <div 
          onClick={() => onNavigateToTab('tasks')}
          className="rounded-2xl bg-[#141624] border border-white/5 p-3.5 hover:border-emerald-500/30 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{completedToday.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Accomplished milestones</div>
        </div>

        <div 
          onClick={() => onNavigateToTab('tasks')}
          className="rounded-2xl bg-[#141624] border border-white/5 p-3.5 hover:border-amber-500/30 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">{pendingToday.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Remaining focus items</div>
        </div>

        <div 
          onClick={() => onNavigateToTab('tasks')}
          className={`rounded-2xl border p-3.5 transition cursor-pointer ${
            overdueCount > 0
              ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
              : 'bg-[#141624] border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overdue</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {overdueCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {overdueCount > 0 ? 'Requires attention' : 'All caught up!'}
          </div>
        </div>
      </div>

      {/* Streak & Gamification Banner (if enabled) */}
      {preferences.gamificationEnabled && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {computedStreak.currentStreak > 0 
                    ? `${computedStreak.currentStreak}-Day Streak Active!` 
                    : 'Start Your Streak Today!'}
                </span>
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  Record: {Math.max(computedStreak.longestStreak, preferences.streak?.longestStreak || 0)} Days
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {computedStreak.currentStreak > 0
                  ? 'Complete at least 1 task every day to extend your productivity streak.'
                  : 'Complete a task today to light your productivity streak flame.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* High-Priority Tasks Spotlight */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              High Priority Focus
            </h2>
            <span className="text-xs text-slate-400">({highPriorityTasks.length} pending)</span>
          </div>
          <button
            onClick={() => onNavigateToTab('tasks')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {highPriorityTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            ✨ No high priority tasks right now. Great job keeping critical items under control!
          </div>
        ) : (
          <div className="space-y-2">
            {highPriorityTasks.map((task) => {
              const cat = categoryMap.get(task.categoryId);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#181a29] border border-white/5 hover:border-indigo-500/30 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <button
                      onClick={() => onToggleComplete(task)}
                      className="w-5 h-5 rounded-lg border-2 border-slate-600 hover:border-emerald-400 flex items-center justify-center shrink-0 cursor-pointer transition"
                    >
                      {task.completed && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => onEditTask(task)}
                          className="text-xs font-semibold text-white truncate cursor-pointer group-hover:text-indigo-200 transition"
                        >
                          {task.title}
                        </span>
                        {task.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {cat && (
                          <span style={{ color: cat.color }} className="font-semibold">
                            {cat.name}
                          </span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Due {task.dueDate === todayStr ? 'Today' : task.dueDate} {task.dueTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditTask(task)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition shrink-0"
                  >
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Grid: Upcoming Deadlines & Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Deadlines</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('calendar')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No upcoming deadlines for the rest of the week.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((task) => {
                const cat = categoryMap.get(task.categoryId);
                return (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="p-2.5 rounded-xl bg-[#181a29] border border-white/5 hover:border-white/15 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-xs font-semibold text-slate-200 block truncate">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {cat && <span>{cat.name}</span>}
                        <span>·</span>
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      task.priority === 'high' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 bg-white/5'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals & Focus Targets */}
        <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Goals & Targets</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {goals.map((g) => {
              // Calculate actual completed count for this goal
              let currentCount = 0;
              if (g.type === 'daily') {
                currentCount = completedToday.length;
              } else if (g.type === 'weekly') {
                // last 7 days completed
                const sevenDaysAgo = offsetLocalDate(todayStr, -7);
                currentCount = tasks.filter((t) => t.completed && t.dueDate >= sevenDaysAgo).length;
              } else {
                // 30 days
                const thirtyDaysAgo = offsetLocalDate(todayStr, -30);
                currentCount = tasks.filter((t) => t.completed && t.dueDate >= thirtyDaysAgo).length;
              }

              const pct = Math.min(100, Math.round((currentCount / g.target) * 100));

              return (
                <div key={g.id} className="p-3 rounded-xl bg-[#181a29] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{g.title}</span>
                    <span className="font-mono text-indigo-400 font-semibold">
                      {currentCount} / {g.target} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
