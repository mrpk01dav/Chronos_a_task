import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Repeat, 
  Layers, 
  X,
  Sparkles,
  Inbox
} from 'lucide-react';
import { CategoryItem, Priority, Task, TaskFilterView } from '../types';
import { TaskCard } from './TaskCard';
import { localDateKey, isTaskOverdue } from '../utils/dateUtils';

interface TaskListViewProps {
  tasks: Task[];
  categories: CategoryItem[];
  activeFilterView: TaskFilterView;
  onFilterViewChange: (view: TaskFilterView) => void;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onTogglePin: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
  onAddNew: () => void;
}

type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'alphabetical';

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  categories,
  activeFilterView,
  onFilterViewChange,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePin,
  onToggleSubtask,
  onSnooze,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const todayStr = localDateKey();

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      today: tasks.filter((t) => t.dueDate === todayStr).length,
      upcoming: tasks.filter((t) => !t.completed && t.dueDate > todayStr).length,
      all: tasks.length,
      overdue: tasks.filter((t) => isTaskOverdue(t)).length,
      completed: tasks.filter((t) => t.completed).length,
      recurring: tasks.filter((t) => t.recurrence && t.recurrence.type !== 'none').length,
    };
  }, [tasks, todayStr]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Primary View filter
      if (activeFilterView === 'today' && t.dueDate !== todayStr) return false;
      if (activeFilterView === 'upcoming' && (t.completed || t.dueDate <= todayStr)) return false;
      if (activeFilterView === 'overdue' && !isTaskOverdue(t)) return false;
      if (activeFilterView === 'completed' && !t.completed) return false;
      if (activeFilterView === 'recurring' && (!t.recurrence || t.recurrence.type === 'none')) return false;

      // Category filter
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Search query filter (matches title and description and notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = (t.description || '').toLowerCase().includes(q);
        const inNotes = (t.notes || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inNotes) return false;
      }

      return true;
    });
  }, [tasks, activeFilterView, selectedCategory, selectedPriority, searchQuery, todayStr]);

  // Sorted tasks (with pinned items first)
  const sortedTasks = useMemo(() => {
    const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

    return [...filteredTasks].sort((a, b) => {
      // Always put pinned items at top (unless in completed view)
      if (activeFilterView !== 'completed') {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }

      if (sortBy === 'dueDate') {
        const dateA = `${a.dueDate} ${a.dueTime || '23:59'}`;
        const dateB = `${b.dueDate} ${b.dueTime || '23:59'}`;
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredTasks, sortBy, activeFilterView]);

  const filterTabs: Array<{ id: TaskFilterView; label: string; count: number }> = [
    { id: 'today', label: 'Today', count: tabCounts.today },
    { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
    { id: 'all', label: 'All Tasks', count: tabCounts.all },
    { id: 'overdue', label: 'Overdue', count: tabCounts.overdue },
    { id: 'completed', label: 'Completed', count: tabCounts.completed },
    { id: 'recurring', label: 'Recurring', count: tabCounts.recurring },
  ];

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSearchQuery('');
  };

  const isFiltered = selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-4 pb-32">
      {/* Header & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Task Manager</h1>
            <p className="text-xs text-slate-400">
              Showing {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-95 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description or notes..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#141624] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-2 rounded-xl bg-[#141624] border border-white/10 text-slate-300 text-xs focus:outline-none cursor-pointer appearance-none pr-7"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Recent</option>
              <option value="alphabetical">A - Z</option>
            </select>
            <ArrowUpDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* View Tabs (Material 3 pill tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilterView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterViewChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#141624] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category & Priority Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">Filter:</span>
          
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#141624] border border-white/10 text-slate-300 text-[11px] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#141624] border border-white/10 text-slate-300 text-[11px] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {isFiltered && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline shrink-0 px-1 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Task List Items */}
      {sortedTasks.length === 0 ? (
        <div className="rounded-2xl bg-[#121420] border border-white/5 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No tasks found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No tasks matching "${searchQuery}". Try a different keyword.`
                : activeFilterView === 'overdue'
                ? 'Awesome! You have zero overdue tasks. You are on top of your schedule!'
                : activeFilterView === 'completed'
                ? 'No completed tasks yet. Finish a task and celebrate the win!'
                : activeFilterView === 'today'
                ? 'No tasks scheduled for today. Ready to plan your day?'
                : 'No tasks in this category or view yet.'}
            </p>
          </div>
          <button
            onClick={onAddNew}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            + Add a Task Now
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              category={categoryMap.get(task.categoryId)}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onTogglePin={onTogglePin}
              onToggleSubtask={onToggleSubtask}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </div>
  );
};
