'use client';

import { BarChart3, Inbox, BookOpen, Users } from 'lucide-react';

interface ISidebarProps {
  activeTab: 'analytics' | 'orders' | 'menu' | 'students';
  setActiveTab: (tab: 'analytics' | 'orders' | 'menu' | 'students') => void;
}

export default function Sidebar({ activeTab, setActiveTab }: ISidebarProps) {
  const navItems = [
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'orders' as const, label: 'Live Orders', icon: Inbox },
    { id: 'menu' as const, label: 'Menu CRUD', icon: BookOpen },
    { id: 'students' as const, label: 'Students Data', icon: Users },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-white border-r border-slate-200/80 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:min-h-[calc(100vh-4rem)]">
      <div className="hidden md:block mb-6 px-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Dashboard</h2>
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/15'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon size={18} className={`${isActive ? 'scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
