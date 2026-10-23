import React from 'react';
import { 
  Bell, 
  Smartphone, 
  Layers, 
  Maximize2, 
  Minimize2,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { User, ShieldCheck } from 'lucide-react';

interface TopHeaderProps {
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenAndroidGuide: () => void;
  mobileFrameMode: boolean;
  onToggleMobileFrame: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  notificationCount,
  onOpenNotifications,
  onOpenAndroidGuide,
  mobileFrameMode,
  onToggleMobileFrame,
  user,
  onOpenAuth,
  onOpenProfile,
}) => {
  return (
    <header className="w-full bg-[#0c0e17]/90 backdrop-blur-md border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center p-1.5 shadow-md shadow-indigo-500/25">
          <img src="/icon.svg" alt="Chronos" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
            Chronos
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              Android
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* User Account / Profile Button */}
        {user ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-white transition cursor-pointer text-xs"
            title={`Account: ${user.displayName}`}
          >
            <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline font-semibold max-w-[90px] truncate">{user.displayName}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Android Guide Button */}
        <button
          onClick={onOpenAndroidGuide}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          title="Native Android Kotlin Architecture & APK Guide"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>APK Guide</span>
        </button>

        {/* Mobile Frame Toggle (for desktop users) */}
        <button
          onClick={onToggleMobileFrame}
          aria-label={mobileFrameMode ? 'Switch to responsive full-screen' : 'Preview inside Android device frame'}
          className="hidden md:flex p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          title={mobileFrameMode ? 'Switch to responsive full-screen' : 'Preview inside Android device frame'}
        >
          {mobileFrameMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          aria-label="Open Android Notification Shade"
          className="relative p-2 rounded-xl bg-[#151726] border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition cursor-pointer"
          title="Open Android Notification Shade"
        >
          <Bell className="w-4 h-4 text-indigo-300" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
