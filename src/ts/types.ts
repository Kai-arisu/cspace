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
  cfg: { obDone?: boolean; survey?: Survey; [key: string]: unknown };
  [key: string]: unknown;
}
