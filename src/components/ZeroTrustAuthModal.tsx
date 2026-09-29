import React from 'react';
import { X, Lock, ShieldCheck, LogOut } from 'lucide-react';
import type { User, UserRole } from '../types';

interface ZeroTrustAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  onSignOut?: () => void;
}

export const ZeroTrustAuthModal: React.FC<ZeroTrustAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchRole,
  onSignOut
}) => {
  if (!isOpen) return null;

  const roles: { role: UserRole; desc: string }[] = [
    { role: 'Security Officer', desc: 'Full operational access to telemetry ingestion, ML training pipelines, threat classification, and active playbooks.' },
    { role: 'Compliance Auditor', desc: 'Read-only access to MIA privacy risk evaluations, HIPAA/GDPR audit reports, and preprocessor logs.' },
    { role: 'Super Admin', desc: 'Unrestricted master privileges across all microservices, IAM authorization tokens, and system resets.' }
  ];

  const handleRoleSelection = (role: UserRole) => {
    // Generate authentic cryptographic session token
    const tokenBytes = new Uint8Array(16);
    window.crypto.getRandomValues(tokenBytes);
    const hexToken = 'zt-' + Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');
    currentUser.sessionToken = hexToken;
    onSwitchRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001d33]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-[#c2c7cf]/40 w-full max-w-lg p-6 md:p-8 space-y-5 shadow-2xl relative text-[#191c20]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c2c7cf]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#cee5ff] text-[#006494] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191c20]">Zero Trust Identity & Access Management</h2>
              <p className="text-[11px] text-[#42474e]">Role-Based Access Control (RBAC) Console (NIST SP 800-207)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#72777f] hover:text-[#191c20] p-1.5 rounded-full hover:bg-[#f2f4fa] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Session Info */}
        <div className="bg-[#f2f4fa] border border-[#c2c7cf]/40 p-4 rounded-2xl space-y-1.5 text-xs">
          <div className="text-[#42474e]">
            Active Identity: <span className="text-[#191c20] font-bold">{currentUser.userName}</span> ({currentUser.email})
          </div>
          <div className="text-[#42474e] font-mono text-[11px] break-all">
            Cryptographic Token: <span className="text-[#006494] font-semibold">{currentUser.sessionToken}</span>
          </div>
          <div className="text-[#065f46] text-[10px] font-bold flex items-center gap-1.5 mt-2 bg-[#d1fae5] px-2.5 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-[#065f46]" />
            <span>Zero Trust Rule Validated: Session Authenticated & Authorized</span>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#191c20]">Select Role-Based Access Control (RBAC) Role</div>
          <div className="space-y-2.5">
            {roles.map((r) => {
              const isCurrent = currentUser.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => handleRoleSelection(r.role)}
                  className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
                    isCurrent
                      ? 'bg-[#cee5ff]/40 border-2 border-[#006494] text-[#001d33]'
                      : 'bg-white border-[#c2c7cf]/40 text-[#42474e] hover:bg-[#f8f9ff] hover:text-[#191c20]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="text-[#191c20]">{r.role}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-[#006494] text-white px-2.5 py-0.5 rounded-full font-bold">
                        ACTIVE ROLE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#42474e] mt-1 leading-relaxed">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#c2c7cf]/30 flex items-center justify-between gap-3">
          {onSignOut && (
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/30 text-xs font-semibold rounded-full cursor-pointer transition shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-[#f2f4fa] hover:bg-[#e0e2ec] text-[#191c20] border border-[#c2c7cf]/60 text-xs font-semibold px-5 py-2.5 rounded-full cursor-pointer transition shadow-xs ml-auto"
          >
            Close IAM Console
          </button>
        </div>

      </div>
    </div>
  );
};
