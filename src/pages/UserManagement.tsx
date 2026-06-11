import { useEffect, useState, useRef, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../api/users';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../types/user';

function getErrMsg(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  return axiosErr.response?.data?.detail ?? 'Operation failed';
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'existing' | 'register'>('existing');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cisfId, setCisfId] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileError, setMobileError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editMobile, setEditMobile] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTempPassword, setResetTempPassword] = useState('');

  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      showToast('Failed to load users', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    let mounted = true;
    listUsers()
      .then(data => { if (mounted) setUsers(data); })
      .catch(() => { if (mounted) showToast('Failed to load users', 'error'); });
    return () => { mounted = false; };
  }, [showToast]);

  const filteredUsers = users.filter(u => u.is_active).filter(u => {
    const name = (u.full_name ?? '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setCisfId('');
    setMobile('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setMobileError(false);
    setPasswordError(false);
    setSelectedRole('ADMIN');
  };

  const handleRegister = async () => {
    const first = firstName.trim();
    const last = lastName.trim();
    const uname = username.trim();
    const pass = password;
    const confirm = confirmPassword;
    const mob = mobile.trim();
    const cisf = cisfId.trim();

    if (!first || !last || !uname || !pass || !confirm) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    let valid = true;

    if (mob && !/^\d{10}$/.test(mob)) {
      setMobileError(true);
      valid = false;
    } else {
      setMobileError(false);
    }

    if (pass !== confirm) {
      setPasswordError(true);
      valid = false;
    } else {
      setPasswordError(false);
    }

    if (!valid) {
      showToast('Registration failed. Please correct the highlighted fields.', 'error');
      return;
    }

    const payload: CreateUserRequest = {
      username: uname,
      password: pass,
      role: selectedRole,
      full_name: `${first} ${last}`,
      cisf_id: cisf || null,
      mobile: mob || null,
    };

    try {
      await createUser(payload);
      showToast(`User ${first} ${last} authorized successfully.`);
      resetForm();
      await fetchUsers();
      setView('existing');
    } catch (err) {
      showToast(getErrMsg(err as AxiosError<{ detail?: string }>), 'error');
    }
  };

  const openEditModal = (user: User) => {
    setEditUserId(user.id);
    const parts = (user.full_name ?? '').split(' ');
    setEditFirstName(parts[0] ?? '');
    setEditLastName(parts.slice(1).join(' ') ?? '');
    setEditMobile(user.mobile ?? '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUserId) return;
    const first = editFirstName.trim();
    const last = editLastName.trim();
    const mob = editMobile.trim();
    if (!first || !last) {
      showToast('Names cannot be empty', 'error');
      return;
    }
    if (mob && !/^\d{10}$/.test(mob)) {
      showToast('Mobile number must be 10 digits', 'error');
      return;
    }
    const payload: UpdateUserRequest = {
      full_name: `${first} ${last}`,
      mobile: mob || null,
    };
    try {
      await updateUser(editUserId, payload);
      showToast('User profile updated successfully.');
      setEditModalOpen(false);
      setEditUserId(null);
      await fetchUsers();
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  const openDeleteModal = (user: User) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.full_name ?? user.username);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId);
      showToast('User deactivated successfully.', 'success');
      setDeleteModalOpen(false);
      setDeleteUserId(null);
      await fetchUsers();
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await resetUserPassword(userId);
      setResetTempPassword(res.temp_password);
      setResetModalOpen(true);
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col md:flex-row gap-gutter p-container-padding">
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${t.type === 'success' ? 'bg-secondary text-on-secondary' : 'bg-error text-on-error'} px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto mb-2`}
          >
            <span className="material-symbols-outlined">{t.type === 'success' ? 'check_circle' : 'error'}</span>
            <span className="font-bold tracking-wide text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="flex flex-col gap-unit">
          <p className="text-label-sm font-label-sm uppercase text-outline mb-stack-sm px-2">Access Management</p>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setView('existing')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                view === 'existing'
                  ? 'bg-surface-container-high text-secondary border border-secondary/20'
                  : 'hover:bg-surface-variant/50 text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined">group</span>
              <span className="font-medium">Existing Users</span>
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                view === 'register'
                  ? 'bg-surface-container-high text-secondary border border-secondary/20'
                  : 'hover:bg-surface-variant/50 text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined">person_add</span>
              <span className="font-medium">Register Users</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {view === 'existing' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="font-headline-md text-headline-md text-on-surface">Personnel Database</h2>
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-secondary text-body-md text-on-surface placeholder:text-outline transition-all"
                  placeholder="Search records..."
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_180px_100px] px-6 py-4 border-b border-outline-variant text-label-sm font-label-sm text-outline uppercase tracking-wider bg-surface-container/50">
                <div>User Details</div>
                <div>Designation</div>
                <div>CISF Identifier</div>
                <div className="text-right">Control</div>
              </div>
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar" id="user-list-container">
                {filteredUsers.length === 0 && (
                  <div className="px-6 py-10 text-center text-on-surface-variant text-body-md">
                    {searchQuery ? 'No users match your search.' : 'No users found.'}
                  </div>
                )}
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_120px_180px_100px] items-center px-6 py-5 border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-surface-bright flex items-center justify-center border border-outline-variant shadow-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">account_circle</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-md font-bold text-on-surface leading-tight truncate">{user.full_name ?? user.username}</span>
                        <span className="text-label-sm font-label-sm text-outline truncate">{user.username}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-label-sm font-label-sm uppercase ${
                        user.role === 'ADMIN'
                          ? 'bg-secondary-container/20 text-secondary border border-secondary/30'
                          : 'bg-surface-variant text-on-surface-variant border border-outline-variant'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="font-label-md text-label-md text-secondary font-bold tracking-tight bg-secondary/5 px-2 py-1 rounded border border-secondary/10 w-fit">
                      {user.cisf_id ?? '—'}
                    </div>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="p-2 text-outline hover:text-warning hover:bg-warning/10 rounded-lg transition-all"
                        title="Reset Password"
                      >
                        <span className="material-symbols-outlined text-[20px]">key</span>
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-outline hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'register' && (
          <div className="flex flex-col gap-stack-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface">Authorized Access Registration</h2>
              <p className="text-on-surface-variant">Initialize a new operator profile within the ecosystem. All fields are mandatory for security validation.</p>
            </div>
            <div className="glass-panel rounded-xl p-8 max-w-2xl border-t-2 border-t-secondary/50">
              <div className="flex flex-col gap-6">
                {/* Role Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-label-sm font-label-sm text-outline uppercase tracking-widest">Access Protocol Level</label>
                  <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant w-full">
                    <button
                      onClick={() => setSelectedRole('ADMIN')}
                      className={`py-3 rounded-lg font-bold transition-all duration-300 ${
                        selectedRole === 'ADMIN'
                          ? 'bg-secondary-container text-on-secondary-container shadow-lg'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      ADMIN
                    </button>
                    <button
                      onClick={() => setSelectedRole('VIEWER')}
                      className={`py-3 rounded-lg font-bold transition-all duration-300 ${
                        selectedRole === 'VIEWER'
                          ? 'bg-secondary-container text-on-secondary-container shadow-lg'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      VIEWER
                    </button>
                  </div>
                </div>

                {/* First/Last Name */}
                <div className="grid grid-cols-2 gap-stack-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-label-sm text-outline">FIRST NAME</label>
                    <input
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-on-surface transition-all text-center"
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-label-sm text-outline">LAST NAME</label>
                    <input
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-on-surface transition-all text-center"
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {/* CISF ID + Mobile */}
                <div className="grid grid-cols-2 gap-stack-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-label-sm text-outline">CISF IDENTIFIER</label>
                    <input
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-on-surface transition-all w-full text-center"
                      placeholder="Enter CISF ID"
                      type="text"
                      value={cisfId}
                      onChange={e => setCisfId(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-label-sm text-outline">MOBILE NO</label>
                    <div className="flex flex-col gap-1">
                      <input
                        className={`bg-surface-container-lowest border rounded-lg p-3 focus:outline-none focus:border-secondary text-on-surface text-center transition-all ${
                          mobileError ? 'border-error' : 'border-outline-variant'
                        }`}
                        maxLength={10}
                        placeholder="10 Digit Number"
                        type="tel"
                        value={mobile}
                        onChange={e => {
                          setMobile(e.target.value);
                          setMobileError(false);
                        }}
                      />
                      {mobileError && (
                        <p className="text-[10px] text-error font-medium italic mt-1">Mobile number must be 10 digits</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-2">
                  <label className="text-label-sm font-label-sm text-outline">SYSTEM USERNAME</label>
                  <input
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary text-on-surface text-center"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-2 gap-stack-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-label-sm text-outline">ACCESS PASSWORD</label>
                    <input
                      className={`bg-surface-container-lowest border rounded-lg p-3 pr-10 focus:outline-none focus:border-secondary text-on-surface text-center transition-all ${
                        passwordError ? 'border-error' : 'border-outline-variant'
                      }`}
                      type="password"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setPasswordError(false);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm font-label-sm text-outline">CONFIRM PASSWORD</label>
                    <input
                      className={`bg-surface-container-lowest border rounded-lg p-3 pr-10 focus:outline-none focus:border-secondary text-on-surface text-center transition-all ${
                        passwordError ? 'border-error' : 'border-outline-variant'
                      }`}
                      type="password"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        setPasswordError(false);
                      }}
                    />
                    {passwordError && (
                      <p className="text-[10px] text-error font-medium italic mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  className="mt-4 flex items-center justify-center gap-3 bg-secondary text-on-secondary py-4 rounded-xl font-bold tracking-widest active:scale-95 transition-all shadow-lg shadow-secondary/20 hover:shadow-secondary/40"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  AUTHORIZE USER
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-tertiary text-[32px]">account_circle</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-sm text-on-surface">Edit User Profile</h3>
                <p className="text-label-sm text-secondary font-bold uppercase tracking-widest">{editFirstName} {editLastName}</p>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm text-outline">FIRST NAME</label>
                  <input
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary text-on-surface transition-all"
                    type="text"
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm text-outline">LAST NAME</label>
                  <input
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary text-on-surface transition-all"
                    type="text"
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label-sm text-outline">MOBILE NUMBER</label>
                <input
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-secondary text-on-surface transition-all"
                  type="tel"
                  value={editMobile}
                  onChange={e => setEditMobile(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1 opacity-70">
                  <label className="text-label-sm text-outline">USERNAME</label>
                  <div className="bg-surface-container/30 border border-outline-variant/30 rounded-lg p-3 text-body-md text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span className="truncate">{users.find(u => u.id === editUserId)?.username ?? ''}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-70">
                  <label className="text-label-sm text-outline">PASSWORD</label>
                  <div className="bg-surface-container/30 border border-outline-variant/30 rounded-lg p-3 text-body-md text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>••••••••</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-outline italic mt-1">* Security fields (Username, Password, CISF ID) are managed by Core Infrastructure.</p>
            </div>
            <div className="p-6 bg-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => { setEditModalOpen(false); setEditUserId(null); }}
                className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 rounded-lg bg-secondary text-on-secondary font-bold shadow-lg hover:shadow-secondary/40 transition-all active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-sm text-on-surface">Confirm Deletion?</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-on-surface-variant">
                Are you sure you want to deactivate <span className="font-bold text-on-surface">{deleteUserName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setDeleteUserId(null); }}
                className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors font-medium"
              >
                No, Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 rounded-lg bg-error text-on-error font-bold shadow-lg hover:shadow-error/40 transition-all active:scale-95"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[32px]">key</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-sm text-on-surface">Password Reset</h3>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-on-surface-variant">
                The user's password has been reset. Share the temporary password below — they will be prompted to change it on next login.
              </p>
              <div className="bg-surface-container-lowest border border-secondary/30 rounded-lg p-4 text-center">
                <span className="font-mono text-xl text-secondary font-bold tracking-wider">{resetTempPassword}</span>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => { setResetModalOpen(false); setResetTempPassword(''); }}
                className="px-6 py-2 rounded-lg bg-secondary text-on-secondary font-bold shadow-lg hover:shadow-secondary/40 transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
