import React from 'react';
import { 
  LayoutDashboard, 
  Radio, 
  Award, 
  Lock, 
  PanelLeftClose, 
  PanelLeftOpen, 
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Exactly the 4 Core Dashboard Pages specified in the design contract
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Overview Dashboard', 
      route: '/dashboard',
      icon: LayoutDashboard,
      module: 'Prediction and Classification'
    },
    { 
      id: 'threat-monitoring', 
      label: 'Threat Monitoring', 
      route: '/threat-monitoring',
      icon: Radio,
      module: 'Prediction and Classification'
    },
    { 
      id: 'model-evaluation', 
      label: 'Model Evaluation', 
      route: '/model-evaluation',
      icon: Award,
      module: 'Training & Feature Selection'
    },
    { 
      id: 'privacy-audit', 
      label: 'Privacy Audit', 
      route: '/privacy-audit',
      icon: Lock,
      module: 'Legal & Ethical Considerations'
    }
  ];

  const renderNavButton = (item: typeof navItems[0], isMobile = false) => {
    const isIconOnly = !isMobile && isCollapsed;
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveTab(item.id);
          if (isMobile) onCloseMobile?.();
        }}
        title={item.label}
        aria-label={item.label}
        className={`w-full flex items-center rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
          isIconOnly ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
        } ${
          isActive
            ? 'bg-[#00639b] text-white shadow-sm'
            : 'text-[#51606f] hover:text-[#191c20] hover:bg-[#eceef4]'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#51606f]'}`} />
        {!isIconOnly && (
          <span className="block truncate font-bold text-xs leading-tight text-left">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#001d33]/50 backdrop-blur-xs z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-canvas Drawer */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-[#e0e2e8] p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e8]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#191c20] tracking-tight">EMMANUEL NAVIGATION</span>
            </div>
            <button 
              onClick={onCloseMobile}
              className="p-1.5 text-[#51606f] hover:text-[#191c20] rounded-xl hover:bg-[#eceef4] transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#72777f] px-3 pb-1 block">
              Core Dashboard Pages
            </span>
            {navItems.map(item => renderNavButton(item, true))}
          </div>
        </div>

        <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-[#e0e2e8] text-center text-[10px] text-[#51606f]">
          Zero Trust Architecture • NIST SP 800-207
        </div>
      </aside>

      {/* Desktop Sticky Rail */}
      <aside 
        className={`hidden md:flex flex-col justify-between shrink-0 bg-white border-r border-[#e0e2e8] sticky top-[53px] h-[calc(100vh-53px)] z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16 p-2' : 'w-64 p-4'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Header Section */}
          {!isCollapsed && (
            <div className="px-1 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#72777f]">
                Core Dashboard Pages
              </span>
            </div>
          )}

          {/* Navigation Links List */}
          <nav className="space-y-1.5">
            {navItems.map(item => renderNavButton(item, false))}
          </nav>
        </div>

        {/* Footer info & collapse toggle */}
        <div className="pt-3 border-t border-[#e0e2e8] space-y-2">
          {!isCollapsed && (
            <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-[#e0e2e8] text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#065f46]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Trust Enforced</span>
              </div>
              <p className="text-[10px] text-[#72777f] mt-0.5">Role-Based Access Control</p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-[#51606f] hover:text-[#191c20] hover:bg-[#eceef4] transition text-xs font-semibold cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
