/**
 * Universal Sync Engine for Motion OS.
 * Handles bidirectional synchronization between internal DB and external services.
 */

import { db, type CalendarEventRecord } from "../data/db";
import { fetchTodayEvents, createCalendarEvent, isSignedIn } from "./services/googleCalendar";

export class SyncEngine {
  private static instance: SyncEngine;
  private syncInterval: any = null;

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Starts the sync engine.
   * Runs a full sync immediately and then every X minutes.
   */
  public start(intervalMinutes: number = 5) {
    if (this.syncInterval) return;
    
    this.sync(); // Run immediately
    this.syncInterval = setInterval(() => this.sync(), intervalMinutes * 60000);
    console.log(`[SyncEngine] Started (Interval: ${intervalMinutes}m)`);
  }

  public stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Performs a full bidirectional sync.
   */
  public async sync() {
    console.log("[SyncEngine] Initiation sync cycle...");
    
    if (isSignedIn()) {
      await this.syncGoogleCalendar();
    }
    
    // Future: Add more services here (Email, Tasks, etc.)
  }

  /**
   * Syncs Google Calendar into Motion OS.
   */
  private async syncGoogleCalendar() {
    try {
      const externalEvents = await fetchTodayEvents();
      
      await db.transaction("rw", db.calendar_events, async () => {
        for (const ext of externalEvents) {
          const existing = await db.calendar_events.where("externalId").equals(ext.id).first();
          
          const record: CalendarEventRecord = {
            externalId: ext.id,
            title: ext.title,
            start: ext.start,
            end: ext.end,
            description: ext.description,
            source: "google",
            status: "synced"
          };

          if (existing) {
            await db.calendar_events.update(existing.id!, record);
          } else {
            await db.calendar_events.add(record);
          }
        }
      });
      
      console.log(`[SyncEngine] Google Calendar synced (${externalEvents.length} events)`);
    } catch (err) {
      console.error("[SyncEngine] Google Calendar sync failed:", err);
    }
  }

  /**
   * Pushes a local event to an external service.
   */
  public async pushEvent(localEventId: number) {
    const local = await db.calendar_events.get(localEventId);
    if (!local || local.status === "synced") return;

    try {
      if (local.source === "google") {
        const result = await createCalendarEvent({
          title: local.title,
          start: local.start,
          end: local.end,
          description: local.description
        });
        
        await db.calendar_events.update(localEventId, {
          externalId: result.id,
          status: "synced"
        });
      }
    } catch (err) {
      console.error("[SyncEngine] Failed to push event:", err);
    }
  }
}

export const syncEngine = SyncEngine.getInstance();
