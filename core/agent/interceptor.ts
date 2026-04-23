import { AgentAction } from './types';
import { useControlMode } from './control';

/**
 * Action Interceptor System: Decides the permission status of any system action 
 * based on the current Agent Control Mode.
 */
export async function interceptAction(action: AgentAction): Promise<{
  status: "approved" | "pending" | "rejected";
  action: AgentAction;
}> {
  const mode = useControlMode.getState().currentMode;

  console.log("Interceptor:", mode, action);

  // IMPORTANT RULES:
  // - Do NOT execute action here
  // - Do NOT modify action
  // - Only decide status
  // - Always return action unchanged

  if (mode === "suggest_only") {
    return {
      status: "rejected",
      action
    };
  }

  if (mode === "semi_auto") {
    return {
      status: "pending",
      action
    };
  }

  if (mode === "full_auto") {
    return {
      status: "approved",
      action
    };
  }

  // Fallback to rejected for safety if mode is unknown
  return {
    status: "rejected",
    action
  };
}
