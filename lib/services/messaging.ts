/**
 * Messaging service for Motion OS.
 * Handles simulated messaging and logs communication objects in the system.
 */

import { db } from "../../data/db";

export interface MessageObject {
  id?: string;
  to: string;
  content: string;
  platform: "whatsapp" | "email" | "sms";
  status: "sent" | "failed" | "pending";
  timestamp: Date;
}

export async function sendMessage(message: Omit<MessageObject, "id" | "status" | "timestamp">): Promise<MessageObject> {
  // In a real system, this would call an API like Twilio or WhatsApp Business API
  console.log(`[Messaging] Sending to ${message.to} via ${message.platform}: ${message.content}`);
  
  const newMessage: MessageObject = {
    ...message,
    status: "sent",
    timestamp: new Date()
  };

  // Log the message in the Motion OS database
  // We'll use a 'communications' collection in a real implementation
  // For now, we'll log it to console and potentially a local store if we extend the DB
  try {
    // If we have a communications table in our DB
    if ((db as any).communications) {
      await (db as any).communications.add(newMessage);
    }
  } catch (err) {
    console.error("Failed to log message to DB:", err);
  }

  return newMessage;
}
