import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  Flag, 
  Repeat, 
  Bell, 
  Plus, 
  Trash2, 
  Check, 
  Pin, 
  FileText, 
  Sparkles,
  Timer
} from 'lucide-react';
import { CategoryItem, Priority, RecurrenceRule, RecurrenceType, ReminderOffset, Subtask, Task, TaskReminder } from '../types';
import { NotificationService } from '../services/notifications';
import { localDateKey } from '../utils/dateUtils';

interface TaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  categories: CategoryItem[];
  defaultReminderOffset: ReminderOffset;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  categories,
  defaultReminderOffset,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('assignments');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [pinned, setPinned] = useState(false);
  const [notes, setNotes] = useState('');
  const [completionRemark, setCompletionRemark] = useState('');

  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Recurrence
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [repeatLimit, setRepeatLimit] = useState<number | undefined>(undefined);

  // Reminders
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [selectedReminderOffset, setSelectedReminderOffset] = useState<ReminderOffset>('15m_before');

  // Error validation
  const [error, setError] = useState('');

  // Reset or initialize on open
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategoryId(taskToEdit.categoryId || 'assignments');
      setPriority(taskToEdit.priority || 'medium');
      setDueDate(taskToEdit.dueDate);
      setDueTime(taskToEdit.dueTime || '12:00');
      setEstimatedDuration(taskToEdit.estimatedDuration || 30);
      setPinned(taskToEdit.pinned || false);
      setNotes(taskToEdit.notes || '');
      setCompletionRemark(taskToEdit.completionRemark || '');
      setSubtasks(taskToEdit.subtasks || []);
      
      const rec = taskToEdit.recurrence || { type: 'none' };
      setRecurrenceType(rec.type);
      setRecurrenceInterval(rec.interval || 1);
      setSelectedWeekdays(rec.daysOfWeek || [1, 3, 5]);
      setRecurrenceEndDate(rec.endDate || '');
      setRepeatLimit(rec.repeatLimit);

      setReminders(taskToEdit.reminders || []);
    } else {
      // Create defaults
      const today = localDateKey();
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || 'assignments');
      setPriority('medium');
      setDueDate(today);
      setDueTime('17:00');
      setEstimatedDuration(30);
      setPinned(false);
      setNotes('');
      setSubtasks([]);
      setRecurrenceType('none');
      setRecurrenceInterval(1);
      setSelectedWeekdays([1, 3, 5]);
      setRecurrenceEndDate('');
      setRepeatLimit(undefined);

      // Default reminder
      if (defaultReminderOffset !== 'none') {
        const scheduledTime = NotificationService.calculateReminderTime(today, '17:00', defaultReminderOffset);
        setReminders([
          {
            id: `rem-${Date.now()}`,
            type: defaultReminderOffset,
            minutesBefore: 15,
            scheduledTime,
            notified: false,
          },
        ]);
      } else {
        setReminders([]);
      }
    }
    setError('');
  }, [taskToEdit, isOpen, categories, defaultReminderOffset]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAddReminder = (offset: ReminderOffset) => {
    let mins = 0;
    if (offset === '5m_before') mins = 5;
    if (offset === '15m_before') mins = 15;
    if (offset === '30m_before') mins = 30;
    if (offset === '1h_before') mins = 60;

    const scheduledTime = NotificationService.calculateReminderTime(dueDate, dueTime, offset, mins);
    const newRem: TaskReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: offset,
      minutesBefore: mins,
      scheduledTime,
      notified: false,
    };
    setReminders([...reminders, newRem]);
  };

  const handleRemoveReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleWeekdayToggle = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length === 1) return; // Keep at least 1 day
      setSelectedWeekdays(selectedWeekdays.filter((d) => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setError('Please select a valid due date.');
      return;
    }

    const recurrence: RecurrenceRule = {
      type: recurrenceType,
      ...(recurrenceType !== 'none' && {
        interval: recurrenceInterval,
        ...(recurrenceType === 'weekly' && { daysOfWeek: selectedWeekdays }),
        ...(recurrenceEndDate && { endDate: recurrenceEndDate }),
        ...(repeatLimit && { repeatLimit }),
        currentOccurrence: taskToEdit?.recurrence?.currentOccurrence || 1,
      }),
    };

    const task: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      priority,
      dueDate,
      dueTime,
      estimatedDuration: Number(estimatedDuration) || 0,
      completed: taskToEdit ? taskToEdit.completed : false,
      completedAt: taskToEdit?.completedAt,
      completionRemark: taskToEdit?.completed ? (completionRemark.trim() || undefined) : undefined,
      pinned,
      subtasks,
      notes: notes.trim(),
      recurrence,
      reminders,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(task);
    onClose();
  };

  // Quick Date presets
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDueDate(localDateKey(d));
  };

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-editor-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#121420] border border-[#25293d] p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 id="task-editor-title" className="text-base font-bold text-white flex items-center gap-2">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close task editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Title & Pin */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 text-xs">Task Title *</label>
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition ${
                  pinned ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200'
                }`}
              >
                <Pin className="w-3 h-3" />
                <span>{pinned ? 'Pinned' : 'Pin Task'}</span>
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study for exam, workout, submit assignment..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#181b2b] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, criteria, references, links..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[#181b2b] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181b2b] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#121420]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Priority</label>
              <div className="flex gap-1.5 p-1 bg-[#181b2b] rounded-xl border border-white/10">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1 rounded-lg font-bold capitalize transition text-[11px] ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white shadow'
                          : p === 'medium'
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-emerald-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date, Time & Quick Presets */}
          <div className="p-3 rounded-xl bg-[#181b2b] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                Schedule Date & Time
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition"
                >
                  Next Week
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#11131e] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
              <div>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#11131e] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Estimated Duration */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Timer className="w-3 h-3 text-indigo-400" />
                Estimated Duration:
              </span>
              <div className="flex items-center gap-1.5">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedDuration(mins)}
                    className={`px-2 py-0.5 rounded text-[10px] transition ${
                      estimatedDuration === mins
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Subtasks / Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})</span>
              </label>
            </div>

            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#181b2b] border border-white/5"
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className={`text-xs ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask step..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#181b2b] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Smart Reminders Section */}
          <div className="p-3 rounded-xl bg-[#181b2b] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-400" />
                Smart Reminders ({reminders.length})
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAddReminder('at_time')}
                  className="px-2 py-0.5 rounded text-[10px] bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition"
                >
                  + At Time
                </button>
                <button
                  type="button"
                  onClick={() => handleAddReminder('15m_before')}
                  className="px-2 py-0.5 rounded text-[10px] bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition"
                >
                  + 15m Before
                </button>
                <button
                  type="button"
                  onClick={() => handleAddReminder('1h_before')}
                  className="px-2 py-0.5 rounded text-[10px] bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition"
                >
                  + 1h Before
                </button>
              </div>
            </div>

            {reminders.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No reminders added yet. Tap a button above to add an alert.</p>
            ) : (
              <div className="space-y-1.5">
                {reminders.map((rem) => {
                  let label = 'At due time';
                  if (rem.type === '5m_before') label = '5 minutes before';
                  if (rem.type === '15m_before') label = '15 minutes before';
                  if (rem.type === '30m_before') label = '30 minutes before';
                  if (rem.type === '1h_before') label = '1 hour before';

                  return (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#11131e] border border-white/5 text-slate-300 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-3 h-3 text-indigo-400" />
                        <span>{label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReminder(rem.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Flexible Task Scheduling & Recurrence */}
          <div className="p-3 rounded-xl bg-[#181b2b] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-purple-400" />
                Flexible Recurrence
              </label>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                className="px-2 py-1 rounded-lg bg-[#11131e] border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="none">One-time Task</option>
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays (Mon - Fri)</option>
                <option value="weekly">Selected Weekdays / Weekly</option>
                <option value="monthly">Every Month</option>
                <option value="yearly">Every Year</option>
                <option value="custom">Custom Interval</option>
              </select>
            </div>

            {/* Recurrence Options */}
            {recurrenceType === 'weekly' && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Repeat on specific days:</span>
                <div className="flex gap-1">
                  {weekdayNames.map((name, idx) => {
                    const isSelected = selectedWeekdays.includes(idx);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleWeekdayToggle(idx)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-[#11131e] text-slate-500 hover:text-white'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(recurrenceType === 'daily' || recurrenceType === 'custom') && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Repeat every:</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 rounded bg-[#11131e] border border-white/10 text-white text-center text-xs"
                />
                <span className="text-[11px] text-slate-400">days</span>
              </div>
            )}

            {recurrenceType !== 'none' && (
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <label className="text-slate-400 block mb-0.5">End date (optional)</label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[#11131e] border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Repeat limit count</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Infinite"
                    value={repeatLimit || ''}
                    onChange={(e) => setRepeatLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 rounded bg-[#11131e] border border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Completion Remark (when editing a completed task) */}
          {taskToEdit?.completed && (
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <label className="font-semibold text-emerald-300 flex items-center gap-1.5 text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Completion Progress Remark
              </label>
              <textarea
                value={completionRemark}
                onChange={(e) => setCompletionRemark(e.target.value)}
                placeholder="What did you accomplish? What did you learn? Any challenges?"
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-[#11131e] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
              <span className="text-[10px] text-emerald-400/80 block">
                Review or edit the progress remark saved for this completed task.
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Important notes, links, reminders, reminders for later..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[#181b2b] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold shadow-lg shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
