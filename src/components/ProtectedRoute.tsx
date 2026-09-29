import React from 'react';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import type { User, UserRole } from '../types';

interface ProtectedRouteProps {
  currentUser: User | null;
  requiredRoles?: UserRole[];
  onOpenAuth?: () => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  requiredRoles,
  onOpenAuth,
  children
}) => {
  // If no user is logged in
  if (!currentUser || !currentUser.isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl border border-[#e0e2e8] p-8 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#cee5ff] text-[#00639b] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#191c20]">Authentication Required</h2>
          <p className="text-xs text-[#51606f] mt-1 max-w-md mx-auto">
            Zero Trust Architecture (NIST SP 800-207) requires verified administrative credentials to access clinical cybersecurity controls.
          </p>
        </div>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-[#00639b] hover:bg-[#005180] text-white text-xs font-semibold rounded-full inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <span>Sign In to Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // If specific roles are required and user doesn't match
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
    return (
      <div className="bg-white rounded-3xl border border-[#ba1a1a]/30 p-8 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm animate-fade-in font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#191c20]">Insufficient Role Clearance</h2>
          <p className="text-xs text-[#51606f] mt-1 max-w-md mx-auto">
            Your current role (<strong className="text-[#191c20]">{currentUser.role}</strong>) does not have privilege clearance for this module. Required role: {requiredRoles.join(' or ')}.
          </p>
        </div>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-[#f2f4fa] hover:bg-[#eceef4] text-[#191c20] border border-[#c2c7cf] text-xs font-semibold rounded-full inline-flex items-center gap-2 transition cursor-pointer"
          >
            <span>Switch IAM Clearance</span>
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
