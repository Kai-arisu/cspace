/**
 * The TypeScript side of the app. esbuild compiles this into `var TS = {...}`
 * inside the app's shared scope (see build.py), and src/app/core/ts-bridge.js
 * gives each export its old global name so the JavaScript can keep calling it.
 * Screens move here one at a time.
 */
export { vIdeas, addIdea, addIdeaText, ideaAct, ideaTitle } from "./screens/ideas";
export { NTPL, vNotes, noteListHTML, noteEditorHTML, nRender, nOutline, nToolbar, nInsert, nToTasks, nFromTpl, newNote, noteAct, noteInput } from "./screens/notes";
export { surveyHTML, surveySteps, surveyAct, surveyDone, surveyShows, surveyFootHTML } from "./screens/survey";
export { agendaHTML, memberAgendaHTML, agendaAct } from "./screens/agenda";
export { aiConnectHTML, aiImport, aiAct } from "./screens/ai-connect";
export { unitsHTML, unitAct, unitsDueSoon } from "./screens/units";
export { radarHTML, radarAct } from "./screens/radar";
export { vClips, clipListHTML, clipAdd, clipAct, clipInput, clipHost, ytId } from "./screens/clips";
