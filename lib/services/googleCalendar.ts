/**
 * Google Calendar & Tasks integration service.
 * Uses the Google Identity Services (GIS) library + Calendar REST API.
 * The OAuth2 token is obtained via a popup and cached in sessionStorage.
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  source: "google" | "motion";
  allDay?: boolean;
  description?: string;
  htmlLink?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: Date;
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks.readonly",
].join(" ");

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

let accessToken: string | null = null;

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("goog_token");
  if (!raw) return null;
  try {
    const { token, expiry } = JSON.parse(raw);
    if (Date.now() < expiry) return token;
    sessionStorage.removeItem("goog_token");
    return null;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresIn: number) {
  sessionStorage.setItem(
    "goog_token",
    JSON.stringify({ token, expiry: Date.now() + expiresIn * 1000 })
  );
  accessToken = token;
}

export async function signInWithGoogle(): Promise<string> {
  const cached = getStoredToken();
  if (cached) {
    accessToken = cached;
    return cached;
  }

  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set"));
      return;
    }

    // @ts-ignore – loaded via script tag
    if (typeof google === "undefined") {
      reject(new Error("Google Identity Services not loaded"));
      return;
    }

    // @ts-ignore
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        storeToken(resp.access_token, resp.expires_in);
        resolve(resp.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export function isSignedIn(): boolean {
  return !!getStoredToken();
}

export function signOut() {
  sessionStorage.removeItem("goog_token");
  accessToken = null;
}

async function apiFetch(url: string): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error("Not signed in");

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${resp.status}`);
  }

  return resp.json();
}

/** Fetch today's events from the primary Google Calendar. */
export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const data = await apiFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
  );

  return (data.items || []).map((item: any) => {
    const isAllDay = !!item.start?.date;
    return {
      id: item.id,
      title: item.summary || "(No title)",
      start: isAllDay
        ? new Date(item.start.date)
        : new Date(item.start.dateTime),
      end: isAllDay ? new Date(item.end.date) : new Date(item.end.dateTime),
      allDay: isAllDay,
      color: item.colorId ? colorMap[item.colorId] : undefined,
      description: item.description,
      htmlLink: item.htmlLink,
      source: "google" as const,
    };
  });
}

/** Fetch tasks from the default Google Tasks list. */
export async function fetchGoogleTasks(): Promise<GoogleTask[]> {
  // Get task lists first
  const listsData = await apiFetch(
    "https://www.googleapis.com/tasks/v1/users/@me/lists?maxResults=10"
  );
  const lists: any[] = listsData.items || [];
  if (lists.length === 0) return [];

  // Use first (default) list
  const listId = lists[0].id;
  const tasksData = await apiFetch(
    `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&maxResults=50`
  );

  return (tasksData.items || []).map((t: any) => ({
    id: t.id,
    title: t.title || "(No title)",
    notes: t.notes,
    status: t.status,
    due: t.due ? new Date(t.due) : undefined,
  }));
}

/** Fetch a full month's events. */
export async function fetchMonthEvents(
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const data = await apiFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
  );

  return (data.items || []).map((item: any) => {
    const isAllDay = !!item.start?.date;
    return {
      id: item.id,
      title: item.summary || "(No title)",
      start: isAllDay
        ? new Date(item.start.date)
        : new Date(item.start.dateTime),
      end: isAllDay ? new Date(item.end.date) : new Date(item.end.dateTime),
      allDay: isAllDay,
      color: item.colorId ? colorMap[item.colorId] : undefined,
      source: "google" as const,
    };
  });
}

const colorMap: Record<string, string> = {
  "1": "#a4bdfc",
  "2": "#7ae7bf",
  "3": "#dbadff",
  "4": "#ff887c",
  "5": "#fbd75b",
  "6": "#ffb878",
  "7": "#46d6db",
  "8": "#e1e1e1",
  "9": "#5484ed",
  "10": "#51b749",
  "11": "#dc2127",
};
