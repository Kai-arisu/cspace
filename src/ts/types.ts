/** The shapes of the data the app keeps. Every item belongs to one space (`sp`). */

export interface Idea {
  id: string;
  sp: string;
  text: string;
  tags?: string[];
  star?: boolean;
  /** true once it has been turned into a task on the board */
  task?: boolean;
  ts: number;
}

export interface Note {
  id: string;
  sp: string;
  title: string;
  body: string;
  pin: boolean;
  ts: number;
}

export type Column = "i" | "m" | "r" | "s";

export interface Task {
  id: string;
  sp: string;
  title: string;
  col: Column;
  due: string;
  pri?: number;
  who?: string;
  ts: number;
  /** the note a checklist line came from */
  from?: string;
}

export interface Post {
  id: string;
  sp: string;
  title: string;
  platform: string;
  date: string;
  status: string;
  ideaId?: string;
  ts: number;
}

export interface Space {
  id: string;
  name: string;
}

/** A person on the owner's team (a row of team_members). */
export interface TeamMember {
  id: string;
  name: string;
  role_title?: string | null;
  status: string;
}

/** A piece of work given to a team member (a row of team_work). */
export interface TeamWork {
  id: string;
  member_id: string;
  title: string;
  due: string;
  status: string;
  done_at?: string | null;
}

/** A loaner device or review sample, with its embargo and return date. */
export interface Unit {
  id: string;
  sp: string;
  name: string;
  brand: string;
  holder: string;
  /** local date and time the embargo lifts, "YYYY-MM-DDTHH:mm", or "" */
  embargo: string;
  /** date it goes back, "YYYY-MM-DD", or "" */
  ret: string;
  status: "with" | "returned";
  ts: number;
}

/** A saved link in the Clips library. */
export interface Clip {
  id: string;
  sp: string;
  url: string;
  title: string;
  note: string;
  tags: string[];
  star: boolean;
  ts: number;
}

/** An item on the moodboard. */
export interface MoodItem {
  id: string;
  sp: string;
  kind: string;
  sec: string;
  value: string;
  label: string;
}

/** A product launch to cover (phone, laptop, AI model) and whether a content plan was made. */
export interface Launch {
  id: string;
  sp: string;
  name: string;
  kind: "phone" | "laptop" | "ai" | "other";
  /** "YYYY-MM-DD" */
  date: string;
  planned: boolean;
  ts: number;
}

/** An access token for an outside assistant (the secret itself is never kept). */
export interface AiToken {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

/** Something an assistant added that the app has yet to import. */
export interface AiInboxRow {
  id: string;
  kind: "idea" | "task" | "note";
  payload: Record<string, unknown>;
}

/** What a new person said about themselves in the welcome survey. */
export interface Survey {
  kind: string;
  size: string;
  goal: string;
  ts: number;
}

export interface State {
  view: string;
  cur: string;
  spaces: Space[];
  ideas: Idea[];
  notes: Note[];
  tasks: Task[];
  posts: Post[];
  income: unknown[];
  clips: Clip[];
  mood: MoodItem[];
  units: Unit[];
  launches: Launch[];
  cfg: { obDone?: boolean; survey?: Survey; [key: string]: unknown };
  [key: string]: unknown;
}
