import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Check, 
  Pin,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { CategoryItem, Priority, Task, UserPreferences } from '../types';
import { localDateKey } from '../utils/dateUtils';

interface CalendarViewProps {
  tasks: Task[];
  categories: CategoryItem[];
  preferences: UserPreferences;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onQuickAddForDate: (dateStr: string) => void;
}

type CalendarLayout = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  categories,
  preferences,
  onToggleComplete,
  onEditTask,
  onQuickAddForDate,
}) => {
  const [layout, setLayout] = useState<CalendarLayout>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    localDateKey()
  );

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const todayStr = localDateKey();

  // Group tasks by date string
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const arr = map.get(t.dueDate) || [];
      arr.push(t);
      map.set(t.dueDate, arr);
    }
    return map;
  }, [tasks]);

  // Month navigation
  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(localDateKey(today));
  };

  // Month Grid Calculation
  const { monthDays, monthTitle } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const title = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // First day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday

    // Adjust for weekStartsOn (0 = Sun, 1 = Mon)
    let offset = startDayOfWeek - preferences.weekStartsOn;
    if (offset < 0) offset += 7;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: localDateKey(prevDate),
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const str = localDateKey(thisDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: localDateKey(nextDate),
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return { monthDays: days, monthTitle: title };
  }, [currentDate, preferences.weekStartsOn, todayStr]);

  // Week Layout Days (7 days centered on selectedDate or current week)
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);
    const dayOfWeek = baseDate.getDay();
    let offset = dayOfWeek - preferences.weekStartsOn;
    if (offset < 0) offset += 7;

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - offset);

    const days: Array<{ dateStr: string; dayName: string; dayNumber: number }> = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startOfWeek);
      cur.setDate(startOfWeek.getDate() + i);
      days.push({
        dateStr: localDateKey(cur),
        dayName: cur.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: cur.getDate(),
      });
    }
    return days;
  }, [selectedDateStr, preferences.weekStartsOn]);

  const selectedDateTasks = useMemo(() => {
    return tasksByDate.get(selectedDateStr) || [];
  }, [tasksByDate, selectedDateStr]);

  const weekdaysHeader = preferences.weekStartsOn === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 pb-32">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Calendar Schedule</h1>
          <p className="text-xs text-slate-400">Plan tasks and review deadlines across time</p>
        </div>

        {/* Layout Switcher (Month / Week / Day) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141624] rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setLayout('month')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              layout === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setLayout('week')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              layout === 'week' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setLayout('day')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              layout === 'day' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Day Agenda
          </button>
        </div>
      </div>

      {/* Month Navigation Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#121420] border border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[140px] text-center">
            {monthTitle}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={jumpToToday}
          className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* MONTH VIEW */}
      {layout === 'month' && (
        <div className="rounded-2xl bg-[#121420] border border-white/5 p-3 sm:p-4 space-y-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 pb-2 border-b border-white/5">
            {weekdaysHeader.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {monthDays.map((cell) => {
              const dayTasks = tasksByDate.get(cell.dateStr) || [];
              const isSelected = cell.dateStr === selectedDateStr;
              const hasIncomplete = dayTasks.some((t) => !t.completed);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[58px] sm:min-h-[72px] p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                      : cell.isToday
                      ? 'bg-slate-800/60 border-indigo-500/40'
                      : cell.isCurrentMonth
                      ? 'bg-[#161827] border-white/5 hover:border-white/20'
                      : 'bg-[#10111a]/40 border-transparent opacity-40 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        cell.isToday
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]'
                          : isSelected
                          ? 'text-indigo-300 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1 rounded">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task indicator dots */}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {dayTasks.slice(0, 3).map((t) => {
                      const cat = categoryMap.get(t.categoryId);
                      return (
                        <span
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.completed ? 'bg-slate-500' : ''
                          }`}
                          style={{
                            backgroundColor: !t.completed ? (cat ? cat.color : '#6366F1') : undefined,
                          }}
                        />
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[8px] text-slate-500 font-mono">+{dayTasks.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {layout === 'week' && (
        <div className="rounded-2xl bg-[#121420] border border-white/5 p-3.5 space-y-3">
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((w) => {
              const dayTasks = tasksByDate.get(w.dateStr) || [];
              const isSelected = w.dateStr === selectedDateStr;
              const isToday = w.dateStr === todayStr;

              return (
                <div
                  key={w.dateStr}
                  onClick={() => setSelectedDateStr(w.dateStr)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isToday
                      ? 'bg-[#1c1f33] border-indigo-500/40 text-slate-200'
                      : 'bg-[#161827] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] block font-medium uppercase">{w.dayName}</span>
                  <span className="text-base font-bold font-mono mt-0.5 block">{w.dayNumber}</span>
                  <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-white/5 text-slate-400'
                  }`}>
                    {dayTasks.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY AGENDA OR SELECTED DAY TASK LIST */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span>
                Schedule for {selectedDateStr === todayStr ? 'Today' : selectedDateStr}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>

          <button
            onClick={() => onQuickAddForDate(selectedDateStr)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <p>No tasks scheduled for this day.</p>
            <button
              onClick={() => onQuickAddForDate(selectedDateStr)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
            >
              + Create a task for {selectedDateStr}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateTasks.map((task) => {
              const cat = categoryMap.get(task.categoryId);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#181a29] border border-white/5 hover:border-indigo-500/30 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <button
                      onClick={() => onToggleComplete(task)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                          : 'border-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => onEditTask(task)}
                          className={`text-xs font-semibold truncate cursor-pointer transition ${
                            task.completed ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-indigo-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {task.dueTime || 'Anytime'}
                        </span>
                        {task.estimatedDuration > 0 && (
                          <>
                            <span>·</span>
                            <span>{task.estimatedDuration}m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditTask(task)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition shrink-0"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
