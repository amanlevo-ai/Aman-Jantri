import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { loginUser } from "../services/authService";
import { UserProfile } from "../types";

interface LoginModalProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage("Please enter your Username or Phone number.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#21324a] text-white p-6 text-center relative border-b border-slate-700">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg text-slate-900 font-black text-xl mb-3">
            A
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-amber-400">
            Aman Parchi software
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Sign in to access Jantri software
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Username / Phone Number:
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or mobile number"
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
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
