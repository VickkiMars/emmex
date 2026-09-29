import React from 'react';
import type { User } from '../types';
import { Shield, UserCheck, Menu, X, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onOpenAuthModal: () => void;
  activeView?: string;
  datasetRecordCount?: number;
  isBackendConnected?: boolean;
  onSelectTab?: (tab: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuthModal,
  onSelectTab,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
  onSignOut
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#e0e2e8] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      
      {/* Left: Brand Identity & Sidebar Toggles */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-[#51606f] hover:text-[#191c20] hover:bg-[#eceef4] transition-colors cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Desktop sidebar collapse/expand toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-2 rounded-xl text-[#51606f] hover:text-[#191c20] hover:bg-[#eceef4] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        {/* Brand Logo & Name */}
        <div 
          onClick={() => onSelectTab && onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Return to Emmanuel Overview Dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-[#00639b] text-white flex items-center justify-center shadow-xs group-hover:bg-[#005180] transition-colors">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#191c20] text-sm tracking-tight">EMMANUEL</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#cee5ff] text-[#001d33] rounded-md">DEFENSE</span>
            </div>
            <p className="text-[10px] text-[#51606f] font-medium hidden sm:block">Clinical Data Breach Prevention</p>
          </div>
        </div>
      </div>

      {/* Right Controls: User Account Profile & Sign Out */}
      <div className="flex items-center gap-1.5 shrink-0">
        {currentUser.isAuthenticated ? (
          <>
            {/* User Identity Pill Switcher */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-[#f2f4fa] hover:bg-[#eceef4] border border-[#c2c7cf]/60 rounded-full text-xs transition cursor-pointer group"
              title="Click to switch role or configure Zero Trust MFA"
            >
              <div className="w-7 h-7 rounded-full bg-[#00639b] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser.userName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block font-bold text-[#191c20] text-[11px] leading-tight group-hover:text-[#00639b] transition-colors">{currentUser.userName}</span>
                <span className="block text-[10px] text-[#51606f] font-medium">{currentUser.role}</span>
              </div>
              <UserCheck className="w-3.5 h-3.5 text-[#72777f] group-hover:text-[#00639b] ml-0.5" />
            </button>

            {/* Quick Sign Out Action */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 text-[#72777f] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#ba1a1a]/20"
                title="Sign Out of Emmanuel"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00639b] hover:bg-[#005180] text-white rounded-full text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Sign In or Register"
          >
            <UserCheck className="w-3.5 h-3.5 text-white" />
            <span>Sign In</span>
          </button>
        )}
      </div>

    </header>
  );
};


