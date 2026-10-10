import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, Cpu, Activity, UserPlus, CheckCircle2, Sparkles, X, LogOut, Layers, Radio } from 'lucide-react';
import { UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onCreateUser: (name: string, role: UserProfile['role']) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSwitchUser,
  onCreateUser,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserProfile['role']>('Pro Master');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    triggerHaptic(25);
    onCreateUser(newName.trim(), newRole);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-dark w-full max-w-md p-6 rounded-[2.5rem] border border-[#FAAD3F]/40 shadow-[0_0_50px_rgba(250,173,63,0.2)] text-white max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F38020] to-[#FAAD3F] p-0.5 flex items-center justify-center shadow-lg">
                <div className="w-full h-full bg-[#111726] rounded-[14px] flex items-center justify-center text-[#FAAD3F] font-bold">
                  {currentUser.avatar}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold font-display italic leading-tight text-white">
                  User Accounts Matrix
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FAAD3F]">
                  Multi-User Identity Engine
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active Profile Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#182338] to-[#0d1424] border border-[#FAAD3F]/40 mb-6 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAAD3F]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{currentUser.avatar}</div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                    {currentUser.name}
                    <ShieldCheck size={16} className="text-[#FAAD3F]" />
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <span className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-[#FAAD3F]/20 border border-[#FAAD3F]/40 text-[#FAAD3F] font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>

            {/* User Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 relative z-10">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">
                  Queries Executed
                </span>
                <span className="text-lg font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                  <Cpu size={14} className="text-[#4285F4]" />
                  {currentUser.queriesCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">
                  Voice DSP Sessions
                </span>
                <span className="text-lg font-mono font-bold text-[#FAAD3F] flex items-center gap-1 mt-0.5">
                  <Radio size={14} className="text-[#FAAD3F]" />
                  {currentUser.voiceSessionsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Account Switcher Section */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold flex items-center gap-1.5">
                <Layers size={14} className="text-[#FAAD3F]" />
                Switch Profile ({allUsers.length})
              </h3>

              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-xs font-mono text-[#FAAD3F] hover:underline flex items-center gap-1 font-bold"
                >
                  <UserPlus size={13} />
                  New Profile
                </button>
              )}
            </div>

            {/* New Profile Form */}
            <AnimatePresence>
              {isCreating && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreate}
                  className="p-4 rounded-2xl bg-[#131b2e] border border-[#FAAD3F]/30 space-y-3 overflow-hidden"
                >
                  <div className="text-xs font-mono font-bold text-[#FAAD3F] uppercase tracking-wider">
                    Create User Identity
                  </div>

                  <input
                    type="text"
                    placeholder="Enter Profile Name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#182338] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FAAD3F]"
                    required
                  />

                  <div className="flex items-center gap-2">
                    {(['Pro Master', 'System Architect', '99% Intelligence Tier'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewRole(role)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                          newRole === role
                            ? 'bg-[#FAAD3F] text-black border-[#FAAD3F]'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {role.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#FAAD3F] text-black font-mono font-bold text-xs shadow-md"
                    >
                      Save Profile
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of Profiles */}
            <div className="space-y-2">
              {allUsers.map((user) => {
                const isActive = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      triggerHaptic(20);
                      onSwitchUser(user.id);
                    }}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-[#FAAD3F]/15 border-[#FAAD3F] text-white shadow-md'
                        : 'bg-[#182236]/50 border-white/5 hover:border-white/15 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{user.avatar}</span>
                      <div className="text-left">
                        <span className="block font-bold text-xs text-white">{user.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{user.role}</span>
                      </div>
                    </div>

                    {isActive ? (
                      <div className="flex items-center gap-1 text-[#FAAD3F] text-[10px] font-mono font-bold uppercase tracking-wider">
                        <CheckCircle2 size={14} />
                        Active
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                        Switch
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
