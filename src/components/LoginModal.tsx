import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle, Shield, ShieldCheck, Sparkles } from "lucide-react";
import { loginUser } from "../services/authService";
import { UserProfile } from "../types";

interface LoginModalProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage(
        mode === "admin"
          ? "Please enter Admin Username."
          : "Please enter your Username or Phone number."
      );
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setIsLoading(true);
      const user = await loginUser(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setUsername("admin");
    setPassword("admin");
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#21324a] text-white p-6 text-center relative border-b border-slate-700">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg text-slate-900 font-black text-xl mb-3">
            {mode === "admin" ? <ShieldCheck className="w-6 h-6 text-slate-950" /> : "A"}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-amber-400">
            {mode === "admin" ? "Admin Control Portal" : "Aman Parchi software"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === "admin"
              ? "Login to set user names, passwords & manage accounts"
              : "Sign in to access Jantri software"}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mt-4 max-w-xs mx-auto border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setMode("user");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "user"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("admin");
                setErrorMessage(null);
                if (!username) setUsername("admin");
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "admin"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Admin Helper Banner */}
          {mode === "admin" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start justify-between gap-2">
              <div>
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Default Admin Access:
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 font-mono">
                  Username: <strong>admin</strong> | Password: <strong>admin</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-md shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                title="Fill default credentials"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-fill</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {mode === "admin" ? "Admin Username:" : "Username / Phone Number:"}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  mode === "admin" ? "Enter admin username (e.g. admin)" : "Enter username or mobile number"
                }
                className="w-full bg-slate-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#21324a] focus:bg-white transition-all shadow-2xs"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#21324a] focus:bg-white transition-all shadow-2xs"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#21324a] to-[#2e4465] hover:from-[#1b293d] hover:to-[#263853] text-amber-400 font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{mode === "admin" ? "Opening Admin Panel..." : "Signing in..."}</span>
              </>
            ) : (
              <span>{mode === "admin" ? "Login to Admin Panel" : "Sign In"}</span>
            )}
          </button>

          {/* Toggle mode link */}
          <div className="text-center pt-1">
            {mode === "user" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("admin");
                  setErrorMessage(null);
                  if (!username) setUsername("admin");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Login / Manage Users &rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("user");
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>&larr; Switch to User Login</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
