import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  Copy,
  Check,
  Lock,
  Calendar,
  CalendarPlus,
  LogOut,
  Search,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  UserX,
  X,
} from "lucide-react";
import {
  adminGetAllUsers,
  adminCreateUser,
  adminToggleUserStatus,
  adminResetUserPassword,
  adminDeleteUser,
  adminExtendUserPlan,
  adminSetUserExpiryDate,
  logoutUser,
} from "../services/authService";
import { UserProfile } from "../types";

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = "users" | "add_user" | "plans" | "security";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter state for Table
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "deactivated">("all");

  // New User Form State
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPlanDays, setNewPlanDays] = useState(365);
  const [isCreating, setIsCreating] = useState(false);

  // Inline Password Reset state
  const [resettingUserPhone, setResettingUserPhone] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState("");

  // Edit Plan Modal / State
  const [editingPlanUser, setEditingPlanUser] = useState<UserProfile | null>(null);
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Change Admin Password State
  const [adminNewPass, setAdminNewPass] = useState("");
  const [isUpdatingAdminPass, setIsUpdatingAdminPass] = useState(false);

  // Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (phone: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [phone]: !prev[phone] }));
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await adminGetAllUsers();
      setUsers(list);
    } catch (err: any) {
      setError(err?.message || "Failed to load users list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const regularUsers = users.filter((u) => u.role !== "admin");
    const totalUsers = regularUsers.length;
    let activePlans = 0;
    let expiredPlans = 0;
    let deactivated = 0;

    const now = Date.now();
    regularUsers.forEach((u) => {
      if (!u.isActive) deactivated++;
      const expiry = u.plan?.expiryDate ? new Date(u.plan.expiryDate).getTime() : 0;
      if (expiry > now && u.isActive) {
        activePlans++;
      } else {
        expiredPlans++;
      }
    });

    return { totalUsers, activePlans, expiredPlans, deactivated };
  }, [users]);

  // Filtered Users for Table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Don't show root admin in the editable clients list
      if (u.role === "admin") return false;

      // Search filter
      const matchesSearch =
        u.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      // Status filter
      const now = Date.now();
      const expiry = u.plan?.expiryDate ? new Date(u.plan.expiryDate).getTime() : 0;
      const isExpired = !expiry || expiry <= now;

      if (statusFilter === "active") return u.isActive && !isExpired;
      if (statusFilter === "expired") return isExpired;
      if (statusFilter === "deactivated") return !u.isActive;

      return true;
    });
  }, [users, searchQuery, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPhone.trim() || !newPassword.trim()) {
      setError("Please enter both Username / Mobile Number and Password.");
      return;
    }

    try {
      setIsCreating(true);
      await adminCreateUser(newPhone.trim(), newPassword.trim(), "user", newPlanDays);
      setSuccess(`User "${newPhone.trim()}" created successfully with ${newPlanDays} days plan!`);
      setNewPhone("");
      setNewPassword("");
      await loadUsers();
      setActiveTab("users");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleExtendPlan = async (phone: string, days: number = 365) => {
    try {
      setError(null);
      const updated = await adminExtendUserPlan(phone, days);
      setSuccess(`User "${phone}" plan extended till ${new Date(updated.expiryDate).toLocaleDateString()}!`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to extend plan.");
    }
  };

  const handleSaveCustomExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanUser || !customExpiryDate) return;

    try {
      setIsUpdatingPlan(true);
      setError(null);
      const iso = new Date(customExpiryDate).toISOString();
      await adminSetUserExpiryDate(editingPlanUser.phoneNumber, iso);
      setSuccess(`Updated validity for "${editingPlanUser.phoneNumber}" till ${new Date(iso).toLocaleDateString()}!`);
      setEditingPlanUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update custom expiry date.");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    try {
      setError(null);
      await adminToggleUserStatus(user.phoneNumber, !user.isActive);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to update user status.");
    }
  };

  const handleResetPassword = async (phone: string) => {
    if (!resetNewPass.trim() || resetNewPass.trim().length < 3) {
      setError("New password must be at least 3 characters.");
      return;
    }

    try {
      setError(null);
      await adminResetUserPassword(phone, resetNewPass.trim());
      setSuccess(`Password for ${phone} updated successfully!`);
      setResettingUserPhone(null);
      setResetNewPass("");
      await loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.");
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPass.trim() || adminNewPass.trim().length < 3) {
      setError("Admin password must be at least 3 characters.");
      return;
    }

    try {
      setIsUpdatingAdminPass(true);
      setError(null);
      await adminResetUserPassword("admin", adminNewPass.trim());
      setSuccess("Admin password updated successfully!");
      setAdminNewPass("");
      await loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update admin password.");
    } finally {
      setIsUpdatingAdminPass(false);
    }
  };

  const handleDeleteUser = async (phone: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${phone}"?`)) {
      return;
    }

    try {
      setError(null);
      await adminDeleteUser(phone);
      setSuccess(`User "${phone}" deleted.`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to delete user.");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#182333] border-b border-slate-700/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Aman Parchi
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Admin Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              User Credentials & Subscription Plan Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="text-slate-300 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 cursor-pointer transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              logoutUser();
              onLogout();
            }}
            className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white font-semibold text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs"
            title="Log out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Menu Bar */}
      <nav className="bg-[#1e2d42] border-b border-slate-700/70 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "users"
              ? "bg-amber-400 text-slate-950 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Users ({metrics.totalUsers})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("add_user")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "add_user"
              ? "bg-amber-400 text-slate-950 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New User</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "plans"
              ? "bg-amber-400 text-slate-950 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Plan & Validity Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "bg-amber-400 text-slate-950 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Admin Security</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-5">
        {/* Global Notifications */}
        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-red-200 shadow-md animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-emerald-200 font-bold shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Top Summary Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Clients</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {metrics.totalUsers}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Registered app accounts</p>
          </div>

          <div className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium">Active Plans</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
              {metrics.activePlans}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">App currently unlocked</p>
          </div>

          <div className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-400 font-medium">Expired Plans</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
              {metrics.expiredPlans}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">App locked pending renewal</p>
          </div>

          <div className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-medium">Deactivated</span>
              <UserX className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
              {metrics.deactivated}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Manually disabled by admin</p>
          </div>
        </section>

        {/* TAB 1: Registered Users Table */}
        {activeTab === "users" && (
          <section className="bg-[#1b2636] border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
            {/* Table Filters Header */}
            <div className="p-4 sm:p-5 border-b border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  User Directory & Plan Table
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search username / phone..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Filter Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Plans</option>
                  <option value="expired">Expired Plans</option>
                  <option value="deactivated">Deactivated</option>
                </select>

                <button
                  type="button"
                  onClick={() => setActiveTab("add_user")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            {isLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                <span>Loading registered users from server...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p>No users found matching your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#151e2b] text-slate-300 font-bold border-b border-slate-700/80 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Username / Mobile</th>
                      <th className="py-3 px-4">Password</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4">Device Status</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.map((u, idx) => {
                      const expiry = u.plan?.expiryDate ? new Date(u.plan.expiryDate) : null;
                      const isExpired = !expiry || Date.now() > expiry.getTime();
                      const daysRemaining = expiry
                        ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                        : 0;

                      const isPasswordShown = !!visiblePasswords[u.phoneNumber];
                      const isResetting = resettingUserPhone === u.phoneNumber;

                      return (
                        <tr
                          key={u.phoneNumber}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            isExpired ? "bg-rose-950/15" : ""
                          }`}
                        >
                          {/* Row Index */}
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {idx + 1}
                          </td>

                          {/* Username */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-white font-mono text-xs sm:text-sm">
                              {u.phoneNumber}
                            </span>
                          </td>

                          {/* Password */}
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700">
                              <span className="font-mono text-amber-300 font-semibold select-all">
                                {isPasswordShown ? u.password : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.phoneNumber)}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-0.5"
                                title={isPasswordShown ? "Hide password" : "Show password"}
                              >
                                {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(u.password, u.phoneNumber)}
                                className="text-slate-400 hover:text-emerald-400 p-0.5 cursor-pointer"
                                title="Copy password"
                              >
                                {copiedId === u.phoneNumber ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Subscription Plan & Expiry */}
                          <td className="py-3 px-4">
                            {isExpired ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                                <Clock className="w-3 h-3 text-rose-400" />
                                <span>Expired ({expiry ? expiry.toLocaleDateString() : "No Plan"})</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                <span>{daysRemaining}d left (Till {expiry?.toLocaleDateString()})</span>
                              </div>
                            )}
                          </td>

                          {/* Device / Account Status */}
                          <td className="py-3 px-4">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>Deactivated</span>
                              </span>
                            )}
                          </td>

                          {/* Last Login */}
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {u.lastLoginAt ? (
                              <span>{new Date(u.lastLoginAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                            ) : (
                              <span className="text-slate-600">Never logged in</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* +1 Year Plan Button */}
                              <button
                                type="button"
                                onClick={() => handleExtendPlan(u.phoneNumber, 365)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs text-[11px]"
                                title="Add 1 Year (365 Days) to this user"
                              >
                                <CalendarPlus className="w-3 h-3" />
                                <span>+1 Year</span>
                              </button>

                              {/* Edit Plan Date */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPlanUser(u);
                                  const currentExp = u.plan?.expiryDate
                                    ? new Date(u.plan.expiryDate).toISOString().split("T")[0]
                                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                                  setCustomExpiryDate(currentExp);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                                title="Edit expiry date"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>Edit Plan</span>
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isResetting) {
                                    setResettingUserPhone(null);
                                  } else {
                                    setResettingUserPhone(u.phoneNumber);
                                    setResetNewPass("");
                                  }
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                                title="Reset password"
                              >
                                <KeyRound className="w-3 h-3 text-blue-400" />
                                <span>Pass</span>
                              </button>

                              {/* Deactivate / Activate */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                className={`px-2 py-1 rounded-lg border font-semibold transition-colors cursor-pointer text-[11px] ${
                                  u.isActive
                                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                }`}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.phoneNumber)}
                                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 p-1 rounded-lg transition-colors cursor-pointer"
                                title="Delete user permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Inline Password Reset Box */}
                            {isResetting && (
                              <div className="mt-2.5 p-2 bg-slate-900 border border-blue-500/40 rounded-xl flex items-center gap-2 animate-in fade-in">
                                <input
                                  type="text"
                                  value={resetNewPass}
                                  onChange={(e) => setResetNewPass(e.target.value)}
                                  placeholder="Enter new password"
                                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(u.phoneNumber)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer shadow-xs"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResettingUserPhone(null)}
                                  className="text-slate-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Add New User */}
        {activeTab === "add_user" && (
          <section className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-lg max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-700/70 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/40">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Create New Client Account
                </h2>
                <p className="text-xs text-slate-400">
                  Set user ID, password, and subscription plan duration
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username / Mobile Number:
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. rahul, aman, or 9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Initial Password:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. 12345 or pass@123"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subscription Plan Duration:
                </label>
                <select
                  value={newPlanDays}
                  onChange={(e) => setNewPlanDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value={365}>1 Year (365 Days) — Standard</option>
                  <option value={730}>2 Years (730 Days)</option>
                  <option value={180}>6 Months (180 Days)</option>
                  <option value={90}>3 Months (90 Days)</option>
                  <option value={30}>1 Month (30 Days)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Assign Plan</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 3: Plan & Validity Overview */}
        {activeTab === "plans" && (
          <section className="space-y-4">
            <div className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-4">
                <Calendar className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Subscription Plans & Quick Renewals
                  </h2>
                  <p className="text-xs text-slate-400">
                    Extend plans or set custom expiry dates for your users
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users
                  .filter((u) => u.role !== "admin")
                  .map((u) => {
                    const expiry = u.plan?.expiryDate ? new Date(u.plan.expiryDate) : null;
                    const isExpired = !expiry || Date.now() > expiry.getTime();
                    const daysRemaining = expiry
                      ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : 0;

                    return (
                      <div
                        key={u.phoneNumber}
                        className={`p-4 rounded-xl border transition-all ${
                          isExpired
                            ? "bg-rose-950/20 border-rose-500/40"
                            : "bg-slate-900/80 border-slate-700/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{u.phoneNumber}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isExpired
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {isExpired ? "EXPIRED" : `${daysRemaining}d left`}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 mt-2">
                          Valid till:{" "}
                          <strong className="text-slate-200">
                            {expiry ? expiry.toLocaleDateString() : "No Plan"}
                          </strong>
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => handleExtendPlan(u.phoneNumber, 365)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>+1 Year</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExtendPlan(u.phoneNumber, 30)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                            title="Add 30 Days"
                          >
                            +30d
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: Admin Security */}
        {activeTab === "security" && (
          <section className="bg-[#1b2636] border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-lg max-w-xl mx-auto space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-700/70">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/40">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Admin Account Security
                </h2>
                <p className="text-xs text-slate-400">
                  Protect your Admin Console by updating the master password
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Admin Password:
                </label>
                <input
                  type="text"
                  value={adminNewPass}
                  onChange={(e) => setAdminNewPass(e.target.value)}
                  placeholder="Enter new master password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingAdminPass}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingAdminPass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Admin Password</span>
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* Edit Plan Custom Expiry Modal */}
        {editingPlanUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1b2636] border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Set Plan Expiry for {editingPlanUser.phoneNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlanUser(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomExpiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select New Expiration Date:
                  </label>
                  <input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      setCustomExpiryDate(d.toISOString().split("T")[0]);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    1 Year from Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 2);
                      setCustomExpiryDate(d.toISOString().split("T")[0]);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    2 Years from Today
                  </button>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingPlan}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingPlan ? "Saving..." : "Save Expiry Date"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlanUser(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
