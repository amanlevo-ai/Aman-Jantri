import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  X,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  Shield,
  Copy,
  Check,
  Lock,
  Calendar,
  CalendarPlus,
} from "lucide-react";
import {
  adminGetAllUsers,
  adminCreateUser,
  adminToggleUserStatus,
  adminResetUserPassword,
  adminDeleteUser,
  adminExtendUserPlan,
} from "../services/authService";
import { UserProfile } from "../types";

interface AdminPanelModalProps {
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New user form state
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPlanDays, setNewPlanDays] = useState(365);
  const [isCreating, setIsCreating] = useState(false);

  // Reset password inline modal state
  const [resettingUserPhone, setResettingUserPhone] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState("");

  // Change admin password state
  const [adminNewPass, setAdminNewPass] = useState("");
  const [isUpdatingAdminPass, setIsUpdatingAdminPass] = useState(false);

  // Copied feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      setSuccess(`User "${phone}" plan extended by 1 Year (valid till ${new Date(updated.expiryDate).toLocaleDateString()})!`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to extend plan.");
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
      setSuccess(`Password for ${phone} updated to "${resetNewPass.trim()}"!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#21324a] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xs text-slate-900 font-bold">
              <Shield className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-400">
                Admin Control Panel
              </h2>
              <p className="text-[11px] text-slate-300">
                Set & manage usernames, passwords & single device access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadUsers}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Quick Guide / How-To Banner */}
          <section className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 text-blue-950 text-xs sm:text-sm">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>How to set User Name & Password (Kaise Banayein):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] sm:text-xs text-blue-800 font-medium pl-1">
              <li>
                Neeche <strong>Username / Mobile Number</strong>, <strong>Password</strong> aur <strong>Plan Validity</strong> select karein.
              </li>
              <li>
                <strong>"+ Add User"</strong> button par click karein. Account turant ban jayega.
              </li>
              <li>
                User ko unka Username aur Password de dein. Vo apne mobile par login kar sakte hain.
              </li>
              <li>
                <strong>Single Device Rule:</strong> Ek user ek waqt me sirf 1 phone par chalega. Dusre phone par login karte hi purana phone logout ho jayega.
              </li>
              <li>
                <strong>Per-Year Subscription Plan:</strong> Expiry date aate hi user ki app lock ho jayegi. Unhe renew karne ke liye unke naam ke aage green <strong>"+1 Year"</strong> button daba dein!
              </li>
              <li>
                Kisi bhi user ka password badalne ke liye unke naam ke aage <strong>"Reset Pass"</strong> par click karein.
              </li>
            </ol>
          </section>

          {/* Create User Form Section */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Create New User & Set Plan (Naya User & Validity Set Karein)</span>
            </h3>

            <form
              onSubmit={handleCreateUser}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username / Mobile Number:
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. rohit or 9876543210"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#21324a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password (e.g. 12345)"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#21324a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plan Duration:
                </label>
                <select
                  value={newPlanDays}
                  onChange={(e) => setNewPlanDays(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#21324a]"
                >
                  <option value={365}>1 Year (365 Days)</option>
                  <option value={730}>2 Years (730 Days)</option>
                  <option value={180}>6 Months (180 Days)</option>
                  <option value={90}>3 Months (90 Days)</option>
                  <option value={30}>1 Month (30 Days)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 h-[38px]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add User</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* User List Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>All Users List ({users.length})</span>
              </h3>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                No users found. Create the first user above.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs divide-y divide-gray-200">
                {users.map((u) => {
                  const isResetting = resettingUserPhone === u.phoneNumber;

                  const expiry = u.plan?.expiryDate ? new Date(u.plan.expiryDate) : null;
                  const isExpired = u.role !== "admin" && (!expiry || new Date() > expiry);
                  const daysRemaining = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

                  return (
                    <div
                      key={u.phoneNumber}
                      className={`p-3 sm:p-4 bg-white transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                        isExpired ? "bg-red-50/20 border-l-4 border-l-red-500" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-900 font-mono">
                            {u.phoneNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === "admin"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              u.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Deactivated</span>
                              </>
                            )}
                          </span>

                          {/* Subscription Plan Badge */}
                          {u.role !== "admin" ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                isExpired
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : daysRemaining <= 15
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>
                                {isExpired
                                  ? `PLAN EXPIRED (${expiry ? expiry.toLocaleDateString() : "No Plan"})`
                                  : `Valid till: ${expiry?.toLocaleDateString()} (${daysRemaining} days left)`}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span>Lifetime Admin</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-600 flex items-center gap-2 flex-wrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            Password:{" "}
                            <strong className="font-mono text-gray-900 select-all">
                              {u.password}
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleCopy(u.password, u.phoneNumber)}
                              className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer ml-1"
                              title="Copy password"
                            >
                              {copiedId === u.phoneNumber ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                          {u.lastLoginAt && (
                            <span className="text-gray-400 text-[10px]">
                              Last login: {new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {/* Extend Plan +1 Year button */}
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleExtendPlan(u.phoneNumber, 365)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Extend user's plan by 1 year (365 days)"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>+1 Year Plan</span>
                          </button>
                        )}

                        {u.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                              u.isActive
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}

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
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{isResetting ? "Cancel" : "Reset Pass"}</span>
                        </button>

                        {u.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.phoneNumber)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Inline password reset input */}
                      {isResetting && (
                        <div className="w-full pt-2 flex items-center gap-2 border-t border-gray-100">
                          <input
                            type="text"
                            value={resetNewPass}
                            onChange={(e) => setResetNewPass(e.target.value)}
                            placeholder="Type new password"
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u.phoneNumber)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs"
                          >
                            Save Password
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Change Admin Own Password Section */}
          <section className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Change Admin Account Password</span>
            </h3>
            <p className="text-[11px] text-amber-800 mb-3">
              Default password is <strong>admin</strong>. You can change it here to protect your Admin Panel.
            </p>
            <form onSubmit={handleUpdateAdminPassword} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={adminNewPass}
                onChange={(e) => setAdminNewPass(e.target.value)}
                placeholder="Enter new admin password"
                className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={isUpdatingAdminPass}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer transition-colors shadow-xs shrink-0 disabled:opacity-50"
              >
                {isUpdatingAdminPass ? "Saving..." : "Update Admin Pass"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
