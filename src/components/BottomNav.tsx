import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  Plus 
} from 'lucide-react';
import { MainNavTab } from '../types';

interface BottomNavProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onQuickAdd: () => void;
  pendingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onQuickAdd,
  pendingCount,
}) => {
  const tabs: Array<{ id: MainNavTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#090b12]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 py-2">
      <div className="max-w-lg mx-auto flex items-center justify-around relative">
        {/* First 2 tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 select-none cursor-pointer ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <div
                  className={`px-3.5 py-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-indigo-600/20' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Center Prominent Floating Action Button (+) */}
        <div className="flex flex-col items-center justify-center px-1">
          <button
            onClick={onQuickAdd}
            aria-label="Create new task"
            className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer border border-white/20"
            title="Create new task"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] text-slate-400 mt-1 font-semibold">Add</span>
        </div>

        {/* Next 3 tabs */}
        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 select-none cursor-pointer ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <div
                  className={`px-3.5 py-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-indigo-600/20' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
