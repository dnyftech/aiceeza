import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Bell, 
  FileText, 
  Play, 
  ShieldAlert, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  X, 
  Zap, 
  Cpu, 
  Terminal, 
  ArrowUpRight,
  Volume2,
  Clock,
  Check
} from 'lucide-react';
import { AssistantTask, AndroidIntentType } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { androidAssistantService } from '../services/androidAssistantService';

interface AndroidAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AssistantTask[];
  onAddTask: (task: Omit<AssistantTask, 'id' | 'createdAt'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const AndroidAssistantModal: React.FC<AndroidAssistantModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'ALL' | AndroidIntentType>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [intentType, setIntentType] = useState<AndroidIntentType>('SET_REMINDER');
  const [scheduledTime, setScheduledTime] = useState('In 10 Seconds');
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });
  const [testedTaskId, setTestedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNotif = async () => {
    triggerHaptic(20);
    const result = await androidAssistantService.requestNotificationPermission();
    setNotifPermission(result);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    triggerHaptic(25);
    onAddTask({
      intentType,
      title: taskTitle.trim(),
      details: taskDetails.trim() || 'Custom Android Intent Task',
      scheduledTime: scheduledTime.trim() || undefined,
      completed: false,
      actionUrl: `intent://com.godai.assistant/${intentType.toLowerCase()}`,
    });

    setTaskTitle('');
    setTaskDetails('');
    setScheduledTime('In 10 Seconds');
    setShowAddForm(false);
  };

  const handleTestReminder = (task: AssistantTask) => {
    triggerHaptic(20);
    setTestedTaskId(task.id);
    androidAssistantService.triggerInstantTaskReminder(task);
    setTimeout(() => {
      setTestedTaskId(null);
    }, 2500);
  };

  const filteredTasks = tasks.filter((t) => (filter === 'ALL' ? true : t.intentType === filter));

  const getIntentBadge = (type: AndroidIntentType) => {
    switch (type) {
      case 'SET_REMINDER':
        return { label: 'Reminder', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Bell };
      case 'CREATE_NOTE':
        return { label: 'Note', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: FileText };
      case 'LAUNCH_APP':
        return { label: 'App Launch', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: Play };
      case 'SYSTEM_CONTROL':
        return { label: 'System Control', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Zap };
      default:
        return { label: 'Intent', color: 'bg-white/10 text-slate-300 border-white/20', icon: Cpu };
    }
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
          className="glass-dark w-full max-w-xl p-6 rounded-[2.5rem] border border-[#34A853]/40 shadow-[0_0_50px_rgba(52,168,83,0.2)] text-white max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#34A853]/20 border border-[#34A853]/40 text-[#34A853]">
                <Smartphone size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display italic leading-tight text-white">
                  Android Assistant Engine
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#34A853]">
                  Intent Dispatcher & Deadline Task Reminder Matrix
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

          {/* Quick Info & Notification Permission Banner */}
          <div className="p-4 rounded-2xl bg-[#131d2e] border border-[#34A853]/30 mb-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#34A853] flex items-center gap-1.5">
                <Terminal size={14} /> Android Intent Intercept & Task Reminders
              </span>

              {notifPermission === 'granted' ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                  <Check size={11} /> Notifications Enabled
                </span>
              ) : (
                <button
                  onClick={handleRequestNotif}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1 font-bold"
                >
                  <Bell size={11} /> Enable Browser Notifications
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When tasks reach their deadline, GOD AI triggers a <span className="text-amber-300 font-medium">Local Browser Notification</span> and a <span className="text-[#FAAD3F] font-medium">Spoken TTS Announcement</span> with audio chime alert.
            </p>
          </div>

          {/* Intent Filters & Add Task Trigger */}
          <div className="flex items-center justify-between gap-2 mb-4 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5">
              {(['ALL', 'SET_REMINDER', 'CREATE_NOTE', 'LAUNCH_APP', 'SYSTEM_CONTROL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    triggerHaptic(15);
                    setFilter(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                    filter === cat
                      ? 'bg-[#34A853] text-black border-[#34A853] shadow-md'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Intents' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                triggerHaptic(15);
                setShowAddForm(!showAddForm);
              }}
              className="p-2 rounded-xl bg-[#34A853]/20 hover:bg-[#34A853]/30 border border-[#34A853]/50 text-[#34A853] transition-all flex items-center gap-1 text-xs font-mono font-bold flex-shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Intent</span>
            </button>
          </div>

          {/* Add Custom Intent Task Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateTask}
                className="p-4 rounded-2xl bg-[#141d2f] border border-[#34A853]/30 mb-6 space-y-3 overflow-hidden"
              >
                <div className="text-xs font-mono font-bold text-[#34A853] uppercase tracking-wider">
                  Dispatch New Android Assistant Intent
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(['SET_REMINDER', 'CREATE_NOTE', 'LAUNCH_APP', 'SYSTEM_CONTROL'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIntentType(type)}
                      className={`p-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all border ${
                        intentType === type
                          ? 'bg-[#34A853] text-black border-[#34A853]'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Intent Task Title..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#1b263b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#34A853]"
                  required
                />

                <textarea
                  placeholder="Intent Parameters / Details..."
                  value={taskDetails}
                  onChange={(e) => setTaskDetails(e.target.value)}
                  className="w-full bg-[#1b263b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#34A853] h-16 resize-none"
                />

                {intentType === 'SET_REMINDER' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-slate-300 block">
                      Reminder Deadline Presets:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'In 10 Seconds',
                        'In 1 Minute',
                        'In 5 Minutes',
                        'In 30 Minutes',
                        'Today 5:00 PM'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setScheduledTime(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors border ${
                            scheduledTime === preset
                              ? 'bg-amber-500 text-black font-bold border-amber-400'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Or enter custom deadline (e.g. In 15 seconds, 10:30 AM)..."
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-[#1b263b] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#34A853]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#34A853] text-black font-mono font-bold text-xs shadow-md"
                  >
                    Dispatch Intent
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                No active assistant intents found for this filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const badge = getIntentBadge(task.intentType);
                const BadgeIcon = badge.icon;
                const isTestingThis = testedTaskId === task.id;

                return (
                  <motion.div
                    key={task.id}
                    layout
                    className={`p-4 rounded-2xl border transition-all ${
                      task.completed
                        ? 'bg-[#121926]/40 border-white/5 opacity-70'
                        : 'bg-[#162136] border-white/10 hover:border-[#34A853]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => {
                            triggerHaptic(20);
                            onToggleTask(task.id);
                          }}
                          className={`mt-0.5 p-1 rounded-lg border transition-all ${
                            task.completed
                              ? 'bg-[#34A853] text-black border-[#34A853]'
                              : 'bg-white/5 border-white/20 text-slate-500 hover:text-slate-300'
                          }`}
                          title={task.completed ? "Mark Incomplete" : "Mark Completed"}
                        >
                          <CheckCircle2 size={16} />
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.color}`}
                            >
                              <BadgeIcon size={11} />
                              {badge.label}
                            </span>
                            {task.scheduledTime && (
                              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                                <Clock size={10} /> {task.scheduledTime}
                              </span>
                            )}
                          </div>

                          <h4
                            className={`font-bold text-sm text-white ${
                              task.completed ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {task.details}
                          </p>

                          {task.actionUrl && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-400 pt-1">
                              <ArrowUpRight size={10} className="text-[#34A853]" />
                              {task.actionUrl}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Instant Reminder Test Trigger Button */}
                        <button
                          onClick={() => handleTestReminder(task)}
                          className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 ${
                            isTestingThis
                              ? 'bg-amber-500 text-black border-amber-400'
                              : 'bg-white/5 border-white/10 hover:border-amber-400/50 text-amber-300 hover:bg-amber-500/10'
                          }`}
                          title="Trigger Reminder Now (Browser Notification & TTS Announcement)"
                        >
                          <Volume2 size={14} className={isTestingThis ? 'animate-bounce' : ''} />
                          <span className="hidden sm:inline text-[10px]">Test Alert</span>
                        </button>

                        <button
                          onClick={() => {
                            triggerHaptic(15);
                            onDeleteTask(task.id);
                          }}
                          className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-colors"
                          title="Delete Intent Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
