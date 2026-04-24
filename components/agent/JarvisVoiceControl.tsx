"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, X, Sparkles, Volume2, VolumeX, Loader2, BrainCircuit } from "lucide-react";
import { eventBus, OS_EVENTS } from "../../core/events";
import { callAI } from "../../lib/ai";
import { processIntent } from "../../core/agent/intent";
import { runAgentAction } from "../../core/agent/orchestrator";
import { createAgentAction } from "../../core/agent/types";

export default function JarvisVoiceControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "executing" | "speaking">("idle");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [wakeWord, setWakeWord] = useState("Motion");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize the main command listener — no background wake-word polling
    if (typeof window !== "undefined" && ("WebKitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);
        if (result.isFinal) {
          handleCommand(text);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (status === "listening") setStatus("idle");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        setStatus("idle");
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus("idle");
    } else {
      setTranscript("");
      setAiResponse("");
      setIsOpen(true);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setStatus("listening");
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setStatus("thinking");
    setTranscript(command);
    
    try {
      // 1. Parse Intent & Extract Actions
      // For now, we use a more versatile prompt than just goal/tasks
      const prompt = `
        You are Motion OS (JARVIS).
        The user said: "${command}"
        
        Available tools/actions:
        - create_task(title, duration, priority, domain)
        - create_page(title, content)
        - architect_system(intent) // Use for complex multi-page requests
        - add_calendar_event(title, start, end, description)
        - send_message(to, content, platform)
        - execute_rpa(task) // Use for web automation or screen tasks
        - summarize_current_page()
        
        Determine the intent and required actions.
        Output ONLY a JSON array of actions.
        Example: [{"type": "create_task", "payload": {"title": "Call John", "priority": "high"}}]
      `;

      const aiRaw = await callAI(prompt, { temperature: 0.1 });
      const aiContent = aiRaw.choices?.[0]?.message?.content || aiRaw;
      const cleanJson = typeof aiContent === "string" ? aiContent.replace(/```json|```/g, "").trim() : aiContent;
      const actions = JSON.parse(cleanJson);

      if (Array.isArray(actions) && actions.length > 0) {
        setStatus("executing");
        for (const actionData of actions) {
          const action = createAgentAction(actionData.type, actionData.payload, `Command: ${command}`);
          await runAgentAction(action);
        }
        setAiResponse("Understood. I've executed those actions for you.");
      } else {
        // Fallback: Just chat
        const chatPrompt = `You are Motion OS (JARVIS). The user said: "${command}". Respond helpfully and concisely.`;
        const chatRaw = await callAI(chatPrompt);
        setAiResponse(chatRaw.choices?.[0]?.message?.content || chatRaw);
      }
      
      setStatus("speaking");
      if (!isMuted) speak(aiResponse);

    } catch (error) {
      console.error("Command Execution Error:", error);
      setAiResponse("I encountered an error while processing that command.");
      setStatus("idle");
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setStatus("idle");
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      {/* AI Interface Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden mb-2"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600/10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Motion Intelligence</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 min-h-[160px] flex flex-col justify-center">
              {status === "listening" && (
                <div className="space-y-3 text-center">
                  <div className="flex justify-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: [10, 25, 10] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        className="w-1 bg-indigo-500 rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Listening...</p>
                  <p className="text-sm text-white font-medium">{transcript || "Go ahead, I'm listening"}</p>
                </div>
              )}

              {status === "thinking" && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Processing Intent...</p>
                </div>
              )}

              {aiResponse && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">JARVIS</p>
                  <p className="text-sm text-zinc-200 leading-relaxed font-medium">{aiResponse}</p>
                </motion.div>
              )}

              {!isListening && status === "idle" && !aiResponse && (
                <p className="text-sm text-zinc-500 text-center italic">
                  Tap the mic to command Motion OS
                </p>
              )}
            </div>

            {/* Text Input Fallback */}
            <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                placeholder="Type a command..."
                className="flex-1 bg-zinc-800 border-none outline-none rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    handleCommand(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Activation Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListen}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-4 ${
          isListening 
            ? "bg-red-500 border-red-500/20 animate-pulse" 
            : "bg-indigo-600 border-indigo-500/20 hover:bg-indigo-500"
        }`}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Mic className="w-6 h-6 text-white" />
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-300 rounded-full blur-[2px]"
            />
          </div>
        )}
      </motion.button>
    </div>
  );
}
