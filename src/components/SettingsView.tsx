import React, { useState, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Calendar, 
  Clock, 
  Tag, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Info, 
  Plus, 
  Check, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { CategoryItem, ReminderOffset, UserPreferences } from '../types';
import { StorageService } from '../services/storage';
import { localDateKey } from '../utils/dateUtils';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  categories: CategoryItem[];
  onUpdateCategories: (newCats: CategoryItem[]) => void;
  onOpenAndroidGuide: () => void;
  onOpenPermissionsModal: () => void;
  onDataRestored: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  categories,
  onUpdateCategories,
  onOpenAndroidGuide,
  onOpenPermissionsModal,
  onDataRestored,
  onResetAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // New Category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');

  // Handle preference update helper
  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = { ...preferences, [key]: value };
    onUpdatePreferences(updated);
  };

  // Export Backup JSON
  const handleExportBackup = async () => {
    try {
      const json = await StorageService.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronos_backup_${localDateKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('Backup downloaded successfully!');
      setTimeout(() => setBackupStatus(null), 3000);
    } catch {
      setBackupStatus('Failed to generate backup.');
    }
  };

  // Restore Backup JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = await StorageService.restoreBackup(text);
        if (result.success) {
          setBackupStatus(result.message);
          onDataRestored();
        } else {
          setBackupStatus(`Error: ${result.message}`);
        }
        setTimeout(() => setBackupStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add custom category
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      color: newCatColor,
      icon: 'Tag',
      isCustom: true,
    };
    const updated = [...categories, newCat];
    onUpdateCategories(updated);
    setNewCatName('');
    setShowAddCategory(false);
  };

  // Delete custom category
  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter((c) => c.id !== catId);
    onUpdateCategories(updated);
  };

  const colorPresets = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

  return (
    <div className="space-y-5 pb-32">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Settings & Preferences</h1>
        <p className="text-xs text-slate-400">Configure notifications, themes, schedules & local data storage</p>
      </div>

      {backupStatus && (
        <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium animate-in fade-in">
          {backupStatus}
        </div>
      )}

      {/* Android Native Integration Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Android System & APK Center</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect Jetpack Compose architecture, build installable APK, or configure background battery settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPermissionsModal}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Battery & Alarms
          </button>
          <button
            onClick={onOpenAndroidGuide}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            APK Build Guide
          </button>
        </div>
      </div>

      {/* 1. Theme & Appearance */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3.5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span>Appearance & Dark Mode</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-slate-200">Theme Mode</span>
              <p className="text-[11px] text-slate-400">Pure dark charcoal or absolute OLED black optimized for battery</p>
            </div>
            <div className="flex gap-1 p-1 bg-[#181a29] rounded-xl border border-white/10">
              <button
                onClick={() => updatePref('theme', 'dark')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  preferences.theme === 'dark' || preferences.theme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark Charcoal
              </button>
              <button
                onClick={() => updatePref('theme', 'oled')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  preferences.theme === 'oled' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                OLED Black
              </button>
            </div>
          </div>

          {/* Mobile frame preview toggle */}
          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Android Mobile Frame Container</span>
              <p className="text-[11px] text-slate-400">Wraps layout inside a Google Pixel mobile device viewport on desktop</p>
            </div>
            <button
              onClick={() => updatePref('mobileFrameMode', !preferences.mobileFrameMode)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.mobileFrameMode ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.mobileFrameMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Notifications & Reminders */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Smart Notifications & Sound Alerts</span>
          </h2>
          <button
            onClick={onOpenPermissionsModal}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Diagnostics
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-slate-200">Real System Notifications</span>
              <p className="text-[11px] text-slate-400">Dispatches native OS notification banners via Web Notification API</p>
            </div>
            <button
              onClick={() => updatePref('systemNotificationsEnabled', !preferences.systemNotificationsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.systemNotificationsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.systemNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Reminder Audio Chime</span>
              <p className="text-[11px] text-slate-400">Plays synthesized offline dual-bell chime when reminders trigger</p>
            </div>
            <button
              onClick={() => updatePref('soundEnabled', !preferences.soundEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Device Vibration</span>
              <p className="text-[11px] text-slate-400">Triggers haptic feedback pattern on mobile phones</p>
            </div>
            <button
              onClick={() => updatePref('vibrationEnabled', !preferences.vibrationEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.vibrationEnabled ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Persistent "Today's Tasks" Notification</span>
              <p className="text-[11px] text-slate-400">Shows pending tasks in notification shade with quick actions</p>
            </div>
            <button
              onClick={() => updatePref('persistentTodayNotification', !preferences.persistentTodayNotification)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.persistentTodayNotification ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.persistentTodayNotification ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Default Reminder Offset</span>
              <p className="text-[11px] text-slate-400">Automatically applied when creating new tasks</p>
            </div>
            <select
              value={preferences.defaultReminder}
              onChange={(e) => updatePref('defaultReminder', e.target.value as ReminderOffset)}
              className="px-2.5 py-1 rounded-lg bg-[#181a29] border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="none">No default reminder</option>
              <option value="at_time">At due time</option>
              <option value="5m_before">5 minutes before</option>
              <option value="15m_before">15 minutes before</option>
              <option value="30m_before">30 minutes before</option>
              <option value="1h_before">1 hour before</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Date, Time & Calendar Preferences */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3.5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>Calendar & Time Formatting</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-slate-200">Week Starts On</span>
              <p className="text-[11px] text-slate-400">Choose start of week for calendar layouts and weekly reports</p>
            </div>
            <div className="flex gap-1 p-1 bg-[#181a29] rounded-xl border border-white/10">
              <button
                onClick={() => updatePref('weekStartsOn', 1)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  preferences.weekStartsOn === 1 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monday
              </button>
              <button
                onClick={() => updatePref('weekStartsOn', 0)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  preferences.weekStartsOn === 0 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sunday
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Time Format</span>
              <p className="text-[11px] text-slate-400">12-hour AM/PM or 24-hour military notation</p>
            </div>
            <div className="flex gap-1 p-1 bg-[#181a29] rounded-xl border border-white/10">
              <button
                onClick={() => updatePref('timeFormat', '12h')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  preferences.timeFormat === '12h' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                12h (AM/PM)
              </button>
              <button
                onClick={() => updatePref('timeFormat', '24h')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  preferences.timeFormat === '24h' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                24h
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Productivity Gamification & Streaks</span>
              <p className="text-[11px] text-slate-400">Track streaks and milestone badges without any shaming</p>
            </div>
            <button
              onClick={() => updatePref('gamificationEnabled', !preferences.gamificationEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.gamificationEnabled ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.gamificationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Category Customization */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>Manage Categories ({categories.length})</span>
          </h2>
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Add Category Form */}
        {showAddCategory && (
          <div className="p-3 rounded-xl bg-[#181a29] border border-indigo-500/30 space-y-3 animate-in fade-in">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Research, Gym, Side Hustle..."
              className="w-full px-3 py-1.5 rounded-lg bg-[#11131e] border border-white/10 text-white text-xs focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full transition ${
                      newCatColor === c ? 'ring-2 ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-xl bg-[#181a29] border border-white/5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="font-semibold text-slate-200">{c.name}</span>
              </div>
              {c.isCustom && (
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-slate-500 hover:text-rose-400 p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Data Backup, Restore & Privacy */}
      <div className="rounded-2xl bg-[#121420] border border-white/5 p-4 sm:p-5 space-y-3.5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Storage & Backup Privacy</span>
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Chronos runs 100% locally on your device using IndexedDB. No accounts, telemetry, or server syncing are required. You maintain complete ownership of your task records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#181a29] border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-white transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Download JSON Backup</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#181a29] border border-white/10 hover:border-purple-500/40 text-xs font-semibold text-white transition cursor-pointer">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Restore from JSON File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="pt-3 border-t border-white/5">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset all tasks and restore defaults...</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
              <span className="text-rose-300 font-semibold">
                Permanently clear all task records?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    onResetAllData();
                  }}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Info Footer */}
      <div className="text-center pt-2 pb-6 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Chronos Task Tracker & Smart Reminders v2.0</p>
        <p>Built for Android & Progressive Web Applications · 100% Offline Capable</p>
      </div>
    </div>
  );
};
