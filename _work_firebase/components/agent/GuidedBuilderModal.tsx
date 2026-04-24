"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  Wand2, CheckCircle2, Rocket, Layout, 
  Palette, MousePointer2, BrainCircuit, Loader2
} from "lucide-react";
import { useModuleBuilder } from "../../core/agent/moduleBuilder";
import { getNextQuestion, type Question } from "../../core/agent/questionEngine";
import { compileModuleLayout, type ModuleLayout } from "../../core/agent/moduleCompiler";
import { refineModuleConfig } from "../../lib/ai";
import { useModuleRegistry } from "../../core/agent/moduleRegistry";
import { fadeIn, slideUp, buttonHover } from "../../lib/animations";

export default function GuidedBuilderModal() {
  const { 
    isOpen, step, config, intent, 
    nextStep, prevStep, updateConfig, resetBuilder, setOpen 
  } = useModuleBuilder();

  const installModule = useModuleRegistry(state => state.installModule);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [compiledLayout, setCompiledLayout] = useState<ModuleLayout | null>(null);

  // Sync current question with config state
  useEffect(() => {
    async function updateFlow() {
      if (isOpen) {
        const q = getNextQuestion(config);
        setCurrentQuestion(q);
        
        // If no more questions, we're ready to "finish"
        if (!q && Object.keys(config).length > 0) {
          setIsRefining(true);
          const refined = await refineModuleConfig(intent, config);
          setCompiledLayout(refined);
          setIsRefining(false);
          setIsFinishing(true);
        } else {
          setIsFinishing(false);
          setCompiledLayout(null);
        }
      }
    }
    updateFlow();
  }, [config, isOpen, intent]);

  const handleNext = () => {
    if (!currentQuestion) return;
    
    // Save current input to config
    updateConfig(currentQuestion.configKey, inputValue);
    setInputValue("");
    nextStep();
  };

  const handleFinish = async () => {
    if (!compiledLayout) return;
    
    console.log("🚀 Installing Module:", compiledLayout);
    
    // Persist the module
    installModule(compiledLayout);
    
    alert(`Success! "${compiledLayout.title}" has been added to your OS. You can find it in the Modules section.`);
    
    resetBuilder();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetBuilder}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Side: Questions (60%) */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Module Architect</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div 
                          key={s} 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            s <= step ? 'w-4 bg-indigo-500' : 'w-2 bg-zinc-800'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={resetBuilder}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8 min-h-[400px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {isRefining ? (
                  <motion.div 
                    key="refining"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-center"
                  >
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-white">Deep Optimization</h3>
                      <p className="text-xs text-zinc-500">Motion AI is refining your architecture and selecting optimal components.</p>
                    </div>
                  </motion.div>
                ) : isFinishing ? (
                  <motion.div 
                    key="finishing"
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 text-center"
                  >
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                      <Rocket className="w-8 h-8 text-green-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">Module Ready</h3>
                      <p className="text-sm text-zinc-400">
                        Optimized for <span className="text-indigo-400 font-bold">{config.moduleType}</span>.
                      </p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Final Logic</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {Object.entries(config).map(([key, val]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-zinc-500 capitalize">{key}</span>
                            <span className="text-zinc-300 font-bold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : currentQuestion ? (
                  <motion.div 
                    key={currentQuestion.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Question {step}
                      </p>
                      <h3 className="text-2xl font-black text-white leading-tight">
                        {currentQuestion.text}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {currentQuestion.inputType === "select" ? (
                        <div className="grid grid-cols-1 gap-2">
                          {currentQuestion.options?.map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                updateConfig(currentQuestion.configKey, option);
                                nextStep();
                              }}
                              className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-800 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-left group"
                            >
                              <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{option}</span>
                              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input 
                          autoFocus
                          type={currentQuestion.inputType}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Type your answer..."
                          onKeyDown={(e) => e.key === "Enter" && handleNext()}
                          className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-white outline-none focus:border-indigo-500 transition-colors shadow-inner"
                        />
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Footer Controls */}
            <div className="p-6 bg-black/20 border-t border-zinc-800 flex items-center justify-between mt-auto">
              <button 
                onClick={prevStep}
                disabled={step <= 1 || isRefining}
                className="btn-ghost text-xs gap-2 py-2 disabled:opacity-0 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {isRefining ? (
                <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <Loader2 className="w-4 h-4 animate-spin" /> Optimizing
                </div>
              ) : isFinishing ? (
                <motion.button 
                  {...buttonHover}
                  onClick={handleFinish}
                  className="btn-primary text-xs gap-2 py-2.5 px-6 shine"
                >
                  Assemble Module <Rocket className="w-4 h-4" />
                </motion.button>
              ) : (
                currentQuestion?.inputType !== "select" && (
                  <motion.button 
                    {...buttonHover}
                    onClick={handleNext}
                    disabled={!inputValue}
                    className="btn-primary text-xs gap-2 py-2.5 px-6 disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )
              )}
            </div>
          </div>

          {/* Right Side: Live Preview (40%) */}
          <div className="hidden md:flex md:w-80 flex-col bg-black/20 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Layout className="w-3 h-3" /> Live Preview
              </h3>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              {Object.keys(config).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <MousePointer2 className="w-8 h-8 text-zinc-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Start configuring to see preview</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mock UI Structure */}
                  <div className="space-y-4">
                    <div className={`w-full h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center px-3 gap-2`}>
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <div className="w-20 h-2 bg-zinc-700 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-zinc-800/30 rounded-xl border border-zinc-800 flex flex-col justify-center px-3 space-y-2">
                        <div className="w-8 h-1.5 bg-zinc-700 rounded-full" />
                        <div className="w-12 h-3 bg-white/10 rounded-full" />
                      </div>
                      <div className="h-16 bg-zinc-800/30 rounded-xl border border-zinc-800 flex flex-col justify-center px-3 space-y-2">
                        <div className="w-8 h-1.5 bg-zinc-700 rounded-full" />
                        <div className="w-12 h-3 bg-white/10 rounded-full" />
                      </div>
                    </div>

                    {/* Dynamic Component Preview */}
                    <AnimatePresence mode="popLayout">
                      {(compileModuleLayout(config)).sections.flatMap(s => s.components).map((c, idx) => (
                        <motion.div 
                          key={`${c.type}-${idx}`}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{c.type}</span>
                            <div className="w-3 h-3 rounded-full bg-indigo-500/20" />
                          </div>
                          <div className="w-full h-1.5 bg-indigo-500/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "60%" }}
                              className="h-full bg-indigo-500/40"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800/50">
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest text-center">
                Powered by Motion OS Adaptive Core
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
