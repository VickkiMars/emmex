import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  KeyRound,
  FileCheck2,
  Crown,
  X
} from 'lucide-react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthPortalProps {
  onAuthenticated: (user: User) => void;
  onClose?: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthenticated, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('officer@emmanuel.health');
  const [signInPassword, setSignInPassword] = useState('Security2026!');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('Security Officer');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demo accounts helper
  const demoAccounts = authService.getDemoAccounts();

  const handleSelectDemo = (email: string, pass: string) => {
    setSignInEmail(email);
    setSignInPassword(pass);
    setErrorMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.signIn(signInEmail, signInPassword);
      if (result.success && result.user) {
        setSuccessMessage(`Welcome back, ${result.user.userName}! Access clearance granted.`);
        setTimeout(() => {
          onAuthenticated(result.user!);
        }, 500);
      } else {
        setErrorMessage(result.error || 'Failed to authenticate. Please verify your email and password.');
      }
    } catch {
      setErrorMessage('An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.signUp(signUpName, signUpEmail, signUpPassword, signUpRole);
      if (result.success && result.user) {
        setSuccessMessage(`Security profile created for ${result.user.userName}. Zero Trust token issued.`);
        setTimeout(() => {
          onAuthenticated(result.user!);
        }, 600);
      } else {
        setErrorMessage(result.error || 'Failed to register account.');
      }
    } catch {
      setErrorMessage('An error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-[#ba1a1a]' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-[#d97706]' };
    return { score: 3, label: 'Strong Clearance', color: 'bg-[#00696e]' };
  };

  const strength = getPasswordStrength(signUpPassword);

  return (
    <div className="fixed inset-0 z-50 bg-[#001d33]/55 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in font-sans">
      
      {/* Main Authentication Container */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#e0e2e8] shadow-2xl p-6 sm:p-8 space-y-6 my-auto relative text-[#191c20]">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-[#72777f] hover:text-[#191c20] p-1.5 rounded-full hover:bg-[#f2f4fa] transition cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00639b] text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center">
              <span className="font-extrabold text-xl tracking-tight text-[#191c20]">EMMANUEL DEFENSE</span>
            </div>
            <p className="text-xs text-[#51606f] mt-1">
              Healthcare Data Breach Prevention & Zero Trust Telemetry
            </p>
          </div>
        </div>

        {/* Tab Toggle (Sign In vs Sign Up) */}
        <div className="flex bg-[#f2f4fa] p-1 rounded-2xl border border-[#e0e2e8]/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-[#001d33] font-bold shadow-xs'
                : 'text-[#51606f] hover:text-[#191c20]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#001d33] font-bold shadow-xs'
                : 'text-[#51606f] hover:text-[#191c20]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 bg-[#ffdad6]/60 border border-[#ba1a1a]/30 rounded-2xl text-xs text-[#ba1a1a] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#cee5ff] border border-[#00639b]/30 rounded-2xl text-xs text-[#001d33] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00639b] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191c20] block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191c20] block">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#72777f] hover:text-[#191c20] cursor-pointer"
                  aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick One-Click Demo Role Selector */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#51606f] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#00639b]" />
                <span>Instant Demo Access</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map(demo => {
                  const isSelected = signInEmail.toLowerCase() === demo.email.toLowerCase();
                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleSelectDemo(demo.email, demo.password)}
                      className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#cee5ff]/70 border-[#00639b] text-[#001d33] font-bold shadow-xs'
                          : 'bg-[#f2f4fa] hover:bg-[#eceef4] border-[#e0e2e8] text-[#42474e]'
                      }`}
                      title={demo.description}
                    >
                      <div className="flex items-center gap-1">
                        {demo.role === 'Super Admin' ? (
                          <Crown className="w-3 h-3 text-[#00639b]" />
                        ) : demo.role === 'Compliance Auditor' ? (
                          <FileCheck2 className="w-3 h-3 text-[#00696e]" />
                        ) : (
                          <KeyRound className="w-3 h-3 text-[#00639b]" />
                        )}
                        <span className="text-[10px] font-bold truncate">{demo.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#00639b] hover:bg-[#005180] active:scale-[0.99] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Emmanuel Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191c20] block">
                Full Name & Title
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Dr. Sarah Connor, CISSP"
                  className="w-full pl-10 pr-4 py-2 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Work Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191c20] block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="s.connor@healthnet.org"
                  className="w-full pl-10 pr-4 py-2 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191c20] block">
                Security Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Security Officer', 'Compliance Auditor', 'Super Admin'] as UserRole[]).map((r) => {
                  const isSelected = signUpRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSignUpRole(r)}
                      className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#cee5ff]/60 border-[#00639b] text-[#001d33] font-bold shadow-xs'
                          : 'bg-[#f2f4fa] hover:bg-[#eceef4] border-[#e0e2e8] text-[#42474e]'
                      }`}
                    >
                      <span className="block text-[11px] font-bold">{r}</span>
                      <span className="block text-[9px] text-[#51606f] font-normal leading-tight mt-0.5">
                        {r === 'Security Officer' ? 'Telemetry & SOC' : r === 'Compliance Auditor' ? 'HIPAA & MIA' : 'Full Cluster'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#191c20]">
                  Security Password
                </label>
                {signUpPassword && (
                  <span className="text-[10px] font-semibold text-[#51606f]">
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#72777f] hover:text-[#191c20] cursor-pointer"
                  aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter bar */}
              {signUpPassword && (
                <div className="w-full bg-[#e0e2e8] h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191c20] block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#00639b] hover:bg-[#005180] active:scale-[0.99] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Creating Security Profile...' : 'Register Clearance & Sign In'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
