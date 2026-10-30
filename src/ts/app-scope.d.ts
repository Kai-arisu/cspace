/**
 * The app's shared scope. The JavaScript files in src/app/ are joined into one
 * function, and the TypeScript in src/ts/ is compiled into that same function,
 * so it can use these directly. Each declaration here matches a definition in
 * src/app/; if one is renamed there, the type check fails here.
 */
import type { Idea, Note, State, Task, Post } from "./types";

declare global {
  /** The whole saved state of the current workspace. */
  var S: State;
  /** True when the signed-in person can only view this workspace. */
  var readOnly: boolean;

  /** The team screen's loaded data. */
  var T: { members: unknown[] };
  interface Window {
    __WS?: unknown;
  }

  // screen state that lives in the shared scope
  var selNote: string | null;
  var noteOpen: boolean;
  var noteMode: "write" | "read";
  var ideaFilter: string;
  var calSel: string;
  var calMonth: Date;

  /** Saves the state (debounced) and syncs it. */
  function touch(): void;
  /** Redraws the current view. */
  function render(): void;
  /** Switches to a view and redraws. */
  function go(view: string): void;
  function toast(text: string): void;
  /** Asks for a second press before running a destructive action. */
  function arm(btn: HTMLElement, fn: () => void): void;

  function $(id: string): HTMLElement | null;
  function esc(s: unknown): string;
  /** An inline SVG icon by name. */
  function I(name: string): string;
  function uid(): string;
  function ago(ts: number): string;
  function words(text: string): number;
  function ymd(d: Date): string;
  function dparse(s: string): Date;
  function findIn<T extends { id: string }>(arr: T[], id: string | null): T | undefined;
  /** The items of one kind that belong to the current space. */
  function mine(kind: "ideas"): Idea[];
  function mine(kind: "notes"): Note[];
  function mine(kind: "tasks"): Task[];
  function mine(kind: "posts"): Post[];

  /** The title block at the top of a screen. */
  function hero(view: string, title: string, sub: string | null, actions: string): string;
  function emptyCard(icon: string, title: string, desc: string, actions: string): string;
  /** A Comment button when comments are available. */
  function cbtn(selector: string): string;
}
export {};
