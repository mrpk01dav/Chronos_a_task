import React, { useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  BatteryCharging, 
  AlertTriangle, 
  Volume2, 
  Zap, 
  Smartphone, 
  Check, 
  X,
  Clock,
  Layers
} from 'lucide-react';
import { NotificationService } from '../services/notifications';

interface AndroidPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionStatus: 'granted' | 'denied' | 'default' | 'unsupported';
  onRequestPermission: () => Promise<void>;
  onTestNotification: () => void;
}

export const AndroidPermissionsModal: React.FC<AndroidPermissionsModalProps> = ({
  isOpen,
  onClose,
  permissionStatus,
  onRequestPermission,
  onTestNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'permissions' | 'battery' | 'oem'>('permissions');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#12141f] border border-[#24283b] p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Android Notification & Alarm Settings</h2>
              <p className="text-xs text-slate-400">Ensure reliable alarms, exact timing & background alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex items-center gap-2 p-1 bg-[#181a29] rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'permissions' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Permissions & Status
          </button>
          <button
            onClick={() => setActiveTab('battery')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'battery' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Exact Alarms & Doze
          </button>
          <button
            onClick={() => setActiveTab('oem')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'oem' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            OEM Restrictions
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {/* Current Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#191c2c] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${permissionStatus === 'granted' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <div>
                    <span className="text-xs font-semibold text-white">System Notification Permission</span>
                    <p className="text-[11px] text-slate-400 capitalize">Current status: {permissionStatus}</p>
                  </div>
                </div>

                {permissionStatus !== 'granted' ? (
                  <button
                    onClick={onRequestPermission}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition active:scale-95 cursor-pointer"
                  >
                    Grant Permission
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <Check className="w-4 h-4" /> Granted
                  </span>
                )}
              </div>

              {/* Test Button */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-indigo-200">Test Real Notification & Chime</span>
                  <p className="text-[11px] text-slate-400">Verifies system sound, vibration, and banner pop</p>
                </div>
                <button
                  onClick={onTestNotification}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Send Test</span>
                </button>
              </div>

              {/* Explanations */}
              <div className="space-y-2.5 text-xs text-slate-300">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Android 13+ Runtime Permission (`POST_NOTIFICATIONS`)
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Starting in Android 13 (API 33), apps must prompt users at runtime for notification authorization. Without this, notifications are blocked silently by the operating system.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'battery' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Android Doze Mode & Exact Alarms</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  When a device is unplugged and stationary with the screen off, Android enters <strong>Doze Mode</strong>. Standard timers are delayed to save battery.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#181a2a] border border-white/5">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Exact Alarm Permission (`SCHEDULE_EXACT_ALARM`)
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    Native Android requires `AlarmManager.setExactAndAllowWhileIdle()` to wake the CPU and fire task alarms to the exact minute even in deep sleep.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#181a2a] border border-white/5">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Notification Channels & High Importance
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    Chronos uses `IMPORTANCE_HIGH` with custom sound channels and vibration patterns, allowing heads-up banners to appear even while playing games or using other apps.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#181a2a] border border-white/5">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Reboot Persistence (`RECEIVE_BOOT_COMPLETED`)
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    When your phone restarts, native alarms are cleared from memory. Chronos registers a `BroadcastReceiver` that queries Room database and reschedules all upcoming reminders instantly on boot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oem' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-[11px] text-slate-400">
                Certain phone manufacturers aggressively kill background services to inflate battery benchmarks. Here is how to whitelist Chronos:
              </p>

              <div className="p-3 rounded-xl bg-[#181a2a] border border-white/5 space-y-1">
                <span className="font-bold text-indigo-300 text-xs">Samsung OneUI / Galaxy</span>
                <p className="text-[11px] text-slate-400">
                  Settings → Battery and device care → Battery → Background usage limits → Add Chronos to <strong>Never sleeping apps</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#181a2a] border border-white/5 space-y-1">
                <span className="font-bold text-indigo-300 text-xs">Xiaomi / Redmi / POCO (MIUI / HyperOS)</span>
                <p className="text-[11px] text-slate-400">
                  Settings → Apps → Manage Apps → Chronos → Enable <strong>Autostart</strong> & Set Battery Saver to <strong>No restrictions</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#181a2a] border border-white/5 space-y-1">
                <span className="font-bold text-indigo-300 text-xs">OnePlus / Oppo / Realme (OxygenOS / ColorOS)</span>
                <p className="text-[11px] text-slate-400">
                  App info → Battery usage → Enable <strong>Allow background activity</strong> & <strong>Allow auto-launch</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
