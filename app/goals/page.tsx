"use client";

import { useEffect } from "react";
import { getGoals } from "../../data/db";
import { useStore } from "../../core/store";
import GoalForm from "../../components/goals/GoalForm";
import GoalList from "../../components/goals/GoalList";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export default function GoalsPage() {
  const setGoals = useStore((state) => state.setGoals);

  useEffect(() => {
    async function loadGoals() {
      try {
        const goals = await getGoals();
        setGoals(goals);
      } catch (error) {
        console.error("Failed to hydrate goals:", error);
      }
    }
    loadGoals();
  }, [setGoals]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 selection:bg-indigo-500/30">
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              Goals
            </h1>
            <p className="text-zinc-500 font-medium">
              Define your core objectives and track your progress.
            </p>
          </div>
        </header>

        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
              Establish New Goal
            </h2>
            <GoalForm />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
              Current Objectives
            </h2>
            <GoalList />
          </div>
        </section>
      </div>
    </div>
  );
}
