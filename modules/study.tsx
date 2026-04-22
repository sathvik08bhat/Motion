import React, { useState } from 'react';
import { Module, registerModule } from '../core/modules/registry';

import { db, addSubject, getSubjects, addTask, Subject, Goal } from '../data/db';

import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Plus, GraduationCap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- UI Components ---

const StudyWidget = () => {
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const goals = useLiveQuery(() => db.goals.toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<number | undefined>(undefined);

  const handleAdd = async () => {
    if (!newName) return;
    await addSubject({
      name: newName,
      goalId: selectedGoal,
      mastery: 30, // Start at 30%
      lastStudiedAt: new Date()
    });
    setNewName('');
    setShowAdd(false);
  };

  const averageMastery = subjects.length > 0 
    ? Math.round(subjects.reduce((acc, s) => acc + s.mastery, 0) / subjects.length)
    : 0;

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <GraduationCap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Study Lab</h3>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Knowledge Engine</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Global Mastery</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white">{averageMastery}%</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
          </div>
        </div>
        <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Subjects</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white">{subjects.length}</span>
            <BookOpen className="w-4 h-4 text-amber-500 mb-1" />
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-3 animate-in fade-in slide-in-from-top-2">
          <input 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Subject name..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
          />
          <select 
            onChange={e => setSelectedGoal(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">Link to Goal (Optional)</option>
            {goals.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
          <button 
            onClick={handleAdd}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Add Subject
          </button>
        </div>
      )}

      {/* Subject List */}
      <div className="space-y-3">
        {subjects.slice(0, 3).map(subject => (
          <div key={subject.id} className="group relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{subject.name}</span>
              <span className="text-[10px] font-black text-zinc-500">{subject.mastery}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000"
                style={{ width: `${subject.mastery}%` }}
              />
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-xs text-zinc-600 italic text-center py-4">No subjects added yet.</p>
        )}
      </div>
    </div>
  );
};

// --- Module Definition ---

export const StudyModule: Module = {
  name: 'Study',
  init: () => {
    console.log('📖 Study Module: Calibrating curriculum...');
  },
  actions: [
    {
      id: 'study.add_subject',
      label: 'Add Subject',
      handler: () => {
        // This would typically open the UI, but for now we just log
        console.log('Action: Add Subject triggered');
      },
      icon: 'GraduationCap'
    },
    {
      id: 'study.generate_plan',
      label: 'Generate Study Plan',
      handler: async () => {
        const subjects = await getSubjects();
        if (subjects.length === 0) {
          alert('Add some subjects first!');
          return;
        }

        // Generate tasks for weak subjects
        const weakSubjects = subjects.sort((a, b) => a.mastery - b.mastery).slice(0, 2);
        for (const sub of weakSubjects) {
          await addTask({
            title: `Study: ${sub.name} (Review Fundamentals)`,
            duration: 45,
            goalId: sub.goalId,
            status: 'todo',
            scheduledAt: new Date(),
            createdAt: new Date()
          });
        }
        alert(`Study plan generated! Added sessions for: ${weakSubjects.map(s => s.name).join(', ')}`);
      }
    }
  ],
  components: {
    Widget: StudyWidget
  },
  onTick: async (store) => {
    const subjects = await getSubjects();
    if (subjects.length === 0) return;

    // Agent Logic: If a subject hasn't been studied in 3 days, trigger a warning or auto-schedule
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const staleSubjects = subjects.filter(s => !s.lastStudiedAt || new Date(s.lastStudiedAt) < threeDaysAgo);

    if (staleSubjects.length > 0) {
      console.log(`🤖 Study Agent: Detected ${staleSubjects.length} stale subjects. Recommending review.`);
      // We could auto-schedule here, but for now we just nudge
    }
  },
  onEvent: {

    'task_completed': async (task) => {
      if (task.title.toLowerCase().includes('study')) {
        const subjects = await getSubjects();
        const subject = subjects.find(s => task.title.includes(s.name));
        if (subject && subject.id) {
          const newMastery = Math.min(100, subject.mastery + 5);
          await db.subjects.update(subject.id, { 
            mastery: newMastery,
            lastStudiedAt: new Date()
          });
        }
      }
    }
  },
  priorityHook: (task) => {
    if (task.title.toLowerCase().includes('study')) {
      return 150; // Significant boost for learning tasks
    }
    return 0;
  }
};





