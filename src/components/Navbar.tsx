import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  Video,
  BookOpen,
  Map,
  Code2,
  FileText,
  Bookmark,
  PlaySquare,
  Users,
  Award,
  User as UserIcon,
  LogOut,
  Sliders,
  Menu,
  X,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'agent', label: 'AI Agent' },
    { id: 'studio', label: 'Video Studio' },
    { id: 'learn', label: 'Learn' },
    { id: 'roadmaps', label: 'Roadmaps' },
    { id: 'labs', label: 'Labs' },
    { id: 'articles', label: 'Articles' },
    { id: 'books', label: 'Books & PDFs' },
    { id: 'videos', label: 'Videos' },
    { id: 'community', label: 'Community' },
    { id: 'careers', label: 'Careers' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/80 bg-black/90 backdrop-blur-md">
      {/* Strict 3-Zone Desktop Navigation */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('home')}
          className="group flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 transition-transform active:scale-95"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400 shadow-[0_0_12px_rgba(0,255,102,0.25)]">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-mono tracking-wider">
            RVCYBER <span className="text-emerald-400">AGENT</span>
          </span>
        </button>

        {/* Zone 2: Single-line clean text links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-zinc-400">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === item.id
                  ? 'text-emerald-400 font-semibold'
                  : 'hover:text-zinc-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Action / User Account Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser?.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  : 'border-emerald-900/80 bg-zinc-950 text-emerald-400 hover:border-emerald-600'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Owner Panel</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'profile'
                    ? 'border border-emerald-500 bg-emerald-950/30 text-emerald-300'
                    : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#00ff66]" />
                <span className="truncate max-w-[110px]">{currentUser.username}</span>
              </button>

              <button
                onClick={onLogout}
                title="Log out"
                className="rounded border border-zinc-800 p-1.5 text-zinc-400 hover:border-red-900/60 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded border border-emerald-500 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-mono font-semibold text-emerald-300 shadow-[0_0_12px_rgba(0,255,102,0.2)] hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Access Terminal</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded border border-zinc-800 p-1.5 text-zinc-400 hover:text-zinc-200 xl:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sub-bar for medium desktop screens to ensure all links remain 1-click reachable */}
      <div className="hidden md:flex xl:hidden border-t border-emerald-950/60 bg-zinc-950/60 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="mx-auto flex items-center gap-4 text-xs font-medium text-zinc-400">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === item.id ? 'text-emerald-400 font-semibold' : 'hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-emerald-950/80 bg-zinc-950/95 p-4 xl:hidden">
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            {mainNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded px-3 py-2 text-left transition-colors ${
                  activeTab === item.id
                    ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}

            {currentUser?.role === 'OWNER' && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="col-span-2 flex items-center gap-2 rounded border border-emerald-500/50 bg-emerald-950/50 px-3 py-2 text-left font-mono text-emerald-300"
              >
                <Sliders className="h-4 w-4" />
                <span>Owner Administration</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
