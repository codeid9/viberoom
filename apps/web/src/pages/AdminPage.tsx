import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminUsers,
  createAdminUser,
  updateUserStatusApi,
  resetUserPasswordApi,
  deleteUserApi,
} from '../services/adminService';
import type { ManagedUser } from '../types/admin';

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reset Password modal state
  const [resetTargetUser, setResetTargetUser] = useState<ManagedUser | null>(null);
  const [resetPasswordText, setResetPasswordText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Delete User confirmation state
  const [deleteTargetUser, setDeleteTargetUser] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load user list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFlashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Create User submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    try {
      setIsCreating(true);
      setErrorMessage(null);
      await createAdminUser(newUsername.trim(), newPassword);
      setShowCreateModal(false);
      setNewUsername('');
      setNewPassword('');
      handleFlashSuccess(`User "${newUsername.trim()}" created successfully`);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle user active / revoked status
  const handleToggleStatus = async (targetUser: ManagedUser) => {
    const nextStatus = targetUser.status === 'active' ? 'revoked' : 'active';
    try {
      setErrorMessage(null);
      await updateUserStatusApi(targetUser.id, nextStatus);
      handleFlashSuccess(`User "${targetUser.username}" is now ${nextStatus}`);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user status');
    }
  };

  // Reset password submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetPasswordText) return;

    try {
      setIsResetting(true);
      setErrorMessage(null);
      await resetUserPasswordApi(resetTargetUser.id, resetPasswordText);
      handleFlashSuccess(`Password reset for "${resetTargetUser.username}". All existing sessions revoked.`);
      setResetTargetUser(null);
      setResetPasswordText('');
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // Delete user submit
  const handleDeleteSubmit = async () => {
    if (!deleteTargetUser) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await deleteUserApi(deleteTargetUser.id);
      handleFlashSuccess(`User "${deleteTargetUser.username}" permanently deleted`);
      setDeleteTargetUser(null);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 bg-neutral-900/70 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20">
            V
          </div>
          <span className="font-semibold text-neutral-100 tracking-tight text-base">
            VibeRoom Admin
          </span>
          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase">
            Management Panel
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Hangout Space
          </Button>
          <Button variant="danger" size="sm" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Users</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Manage accounts for your private VibeRoom friends.
            </p>
          </div>
          <Button size="md" onClick={() => setShowCreateModal(true)}>
            + Create User
          </Button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
            {successMessage}
          </div>
        )}

        {/* User Table Container */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-neutral-500 text-xs">
              <span className="w-5 h-5 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin" />
              Loading accounts...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 text-xs">
              No users found. Create the first user above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900/90 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Username</th>
                    <th className="px-5 py-3.5 font-medium">Role</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Created</th>
                    <th className="px-5 py-3.5 font-medium">Last Login</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {users.map((u) => {
                    const isSelf = user?.username === u.username;
                    return (
                      <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white flex items-center gap-2">
                          <span>{u.username}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              u.role === 'admin'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                              u.status === 'active'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                                : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-400">
                          {new Date(u.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-neutral-400">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Never'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Status (Active / Revoke) */}
                            {!isSelf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(u)}
                                className={`text-[11px] ${
                                  u.status === 'active'
                                    ? 'hover:text-rose-400'
                                    : 'hover:text-emerald-400'
                                }`}
                              >
                                {u.status === 'active' ? 'Revoke' : 'Activate'}
                              </Button>
                            )}

                            {/* Reset Password */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResetTargetUser(u);
                                setResetPasswordText('');
                              }}
                              className="text-[11px] hover:text-indigo-400"
                            >
                              Reset PW
                            </Button>

                            {/* Delete User */}
                            {!isSelf && u.role !== 'admin' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteTargetUser(u)}
                                className="text-[11px]"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create Friend Account</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                New accounts receive the default "user" role.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400 font-medium">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. friend_name"
                  required
                  autoFocus
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400 font-medium">Temporary Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || !newUsername.trim() || newPassword.length < 8}
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Reset Password: {resetTargetUser.username}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                This will immediately invalidate all active sessions for this user.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400 font-medium">New Password</label>
                <input
                  type="text"
                  value={resetPasswordText}
                  onChange={(e) => setResetPasswordText(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  autoFocus
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setResetTargetUser(null)}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResetting || resetPasswordText.length < 8}
                >
                  {isResetting ? 'Saving...' : 'Set New Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-neutral-900 border border-rose-900/50 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-rose-300 tracking-tight">Delete User Account?</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Are you sure you want to delete <strong className="text-white">{deleteTargetUser.username}</strong>? This action cannot be undone. All active sessions will be terminated immediately.
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTargetUser(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};