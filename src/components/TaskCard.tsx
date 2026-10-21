import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  Pin, 
  MoreVertical, 
  Repeat, 
  Bell, 
  CheckSquare, 
  Copy, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Timer,
  AlertCircle,
  FileText
} from 'lucide-react';
import { CategoryItem, Priority, Task } from '../types';

interface TaskCardProps {
  task: Task;
  category?: CategoryItem;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onTogglePin: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePin,
  onToggleSubtask,
  onSnooze,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !task.completed && task.dueDate < todayStr;
  const isToday = task.dueDate === todayStr;

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Priority color accents
  const getPriorityStyle = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        task.completed
          ? 'bg-[#0f111a]/70 border-white/5 opacity-70 hover:opacity-100'
          : isOverdue
          ? 'bg-[#15121b] border-rose-500/30 hover:border-rose-500/50 shadow-sm'
          : task.pinned
          ? 'bg-[#141624] border-indigo-500/30 shadow-md hover:border-indigo-500/50'
          : 'bg-[#131520] border-white/5 hover:border-white/15 hover:shadow-lg'
      } p-3.5 sm:p-4`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5 cursor-pointer ${
            task.completed
              ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
              : 'border-2 border-slate-600 hover:border-indigo-400 bg-black/20'
          }`}
          title={task.completed ? 'Mark incomplete' : 'Mark completed'}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {/* Category */}
              {category && (
                <span
                  className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                >
                  {category.name}
                </span>
              )}

              {/* Priority */}
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                {task.priority}
              </span>

              {/* Pin indicator */}
              {task.pinned && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  <Pin className="w-2.5 h-2.5" />
                  <span>Pinned</span>
                </span>
              )}

              {/* Recurrence badge */}
              {task.recurrence && task.recurrence.type !== 'none' && (
                <span className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                  <Repeat className="w-2.5 h-2.5" />
                  <span className="capitalize">{task.recurrence.type}</span>
                </span>
              )}
            </div>

            {/* Menu button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-7 z-40 w-44 rounded-xl bg-[#181a29] border border-white/10 shadow-2xl p-1 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(task);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-left transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Task</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDuplicate(task);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-left transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onTogglePin(task.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-left transition"
                    >
                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{task.pinned ? 'Unpin' : 'Pin to Top'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onSnooze(task.id, 15);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-left transition"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Snooze 15 mins</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(task.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 text-left transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className={`text-sm sm:text-base font-semibold leading-snug cursor-pointer hover:text-indigo-300 transition ${
              task.completed ? 'line-through text-slate-500' : 'text-slate-100'
            }`}
            onClick={() => onEdit(task)}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Metadata Row: Date, Time, Duration, Reminders */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
            {/* Due Date & Time */}
            <div
              className={`flex items-center gap-1 font-medium ${
                isOverdue ? 'text-rose-400' : isToday ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {isToday ? 'Today' : task.dueDate}
                {task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-0.5 text-[10px] text-rose-400 ml-1 font-bold">
                  <AlertCircle className="w-2.5 h-2.5" /> Overdue
                </span>
              )}
            </div>

            {/* Estimated Duration */}
            {task.estimatedDuration > 0 && (
              <div className="flex items-center gap-1 text-slate-500">
                <Timer className="w-3 h-3 text-slate-500" />
                <span>{task.estimatedDuration}m</span>
              </div>
            )}

            {/* Reminders count */}
            {task.reminders && task.reminders.length > 0 && (
              <div className="flex items-center gap-1 text-indigo-400/80">
                <Bell className="w-3 h-3" />
                <span>{task.reminders.length} reminder{task.reminders.length > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Notes Indicator */}
            {task.notes && (
              <div className="flex items-center gap-1 text-slate-500" title="Has notes">
                <FileText className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Subtasks Progress & Inline Checklist */}
          {totalSubtasks > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/5">
              <button
                onClick={() => setExpandedSubtasks(!expandedSubtasks)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium text-[11px]">
                    Subtasks: {completedSubtasks}/{totalSubtasks} ({subtasksPercent}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${subtasksPercent}%` }}
                    />
                  </div>
                  {expandedSubtasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              {expandedSubtasks && (
                <div className="mt-2 space-y-1.5 pl-1 animate-in fade-in duration-150">
                  {task.subtasks.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => onToggleSubtask(task.id, st.id)}
                        className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={st.completed ? 'line-through text-slate-500' : ''}>
                        {st.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
