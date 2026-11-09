// Prompt assembly and response parsing (complete files in delimited blocks).
import fs from 'node:fs';
import path from 'node:path';
import { listFiles, OBS_DIR } from './testrun.mjs';

export const TASKS_DIR = path.join(OBS_DIR, 'tasks');

export function loadTask(id) {
  const dir = path.join(TASKS_DIR, id);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'task.json'), 'utf8'));
  const read = (sub) => Object.fromEntries(listFiles(path.join(dir, sub)).map((f) => [`${sub}/${f}`, fs.readFileSync(path.join(dir, sub, f), 'utf8')]));
  const manifest = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, 'manifest.json'), 'utf8'));
  return { id, dir, meta, src: read('src'), visible: read('visible'), expected: manifest.tasks[id]?.expected || null };
}

export const SYSTEM_SOLVER = `You are an expert JavaScript (Node.js, ES modules) engineer fixing bugs in a small codebase.
You cannot run code or tools; reason carefully from the specification.
OUTPUT FORMAT (mandatory): for every file you change, output its COMPLETE new content inside a block exactly like:
=== FILE: src/<path>.mjs ===
<entire file content>
=== END FILE ===
Only files under src/ may be changed; never output test files; do not create new files. Do not use markdown fences inside blocks.
Outside the blocks write at most 3 short lines. If no change is needed, output NO CHANGES.`;

export const SYSTEM_CRITIC = `You are a meticulous JavaScript code reviewer. You cannot run code. Given a specification, the original buggy code, a proposed fix and visible test results, find remaining defects: behaviors that violate the specification (including edge cases not covered by visible tests), regressions, or incomplete fixes. Be concrete (file, function, input, expected vs actual). If you find no defect, answer exactly: APPROVE. Do not output full files.`;

export const SYSTEM_PLANNER = `You are a software triage planner. You cannot run code. Decide whether a bug-fixing task can be split into INDEPENDENT subproblems, each confined to a disjoint set of source files, such that fixing each one does not require knowing how the others are fixed (no shared convention/format/contract mismatch across files). Answer ONLY with JSON: {"decomposable": boolean, "reason": string, "subproblems": [{"files": ["src/..."], "goal": string}]}. If not decomposable, return one subproblem with all files that likely need changes.`;

function fileBlock(name, content) { return `--- ${name} ---\n${content.replace(/\s+$/, '')}\n--- end ${name} ---`; }

export function taskPrompt(task, { editable = null, extra = '' } = {}) {
  const parts = [];
  parts.push(`# Task: ${task.meta.title}\n\n## Specification and reported problem\n${task.meta.statement}`);
  parts.push(`## Source files (current, buggy)\n` + Object.entries(task.src).map(([k, v]) => fileBlock(k, v)).join('\n\n'));
  parts.push(`## Visible tests (a hidden test suite will also check the full specification)\n` + Object.entries(task.visible).map(([k, v]) => fileBlock(k, v)).join('\n\n'));
  if (editable) parts.push(`## Your scope\nYou may ONLY change these files: ${editable.join(', ')}. Other files are context only; assume other bugs (if any) are being fixed by teammates.`);
  if (extra) parts.push(extra);
  parts.push(`Fix the bugs so the code satisfies the full specification (not only the visible tests). Return complete changed files in the mandatory block format.`);
  return parts.join('\n\n');
}

export function feedbackBlock(candidate, testRes, title = 'Previous candidate') {
  const files = Object.entries(candidate).map(([k, v]) => fileBlock(k, v)).join('\n\n') || '(no files changed)';
  const fails = (testRes?.failures || []).slice(0, 12).map((f) => `- [${f.file}] ${f.name}: ${f.message}`).join('\n');
  return `## ${title}\n${files}\n\n## Visible test results for this candidate: ${testRes.pass}/${testRes.total} passing\n${fails || '(all visible tests pass)'}`;
}

export function parseFiles(text, allowed) {
  const out = {};
  const re = /^=== FILE: (.+?) ===[ \t]*\r?\n([\s\S]*?)^=== END FILE ===/gm;
  let m;
  while ((m = re.exec(text))) {
    let name = m[1].trim().replace(/^\.\//, '');
    if (!name.startsWith('src/')) name = 'src/' + name;
    let body = m[2];
    const fence = body.match(/^```[a-z]*\r?\n([\s\S]*?)\r?\n```\s*$/);
    if (fence) body = fence[1] + '\n';
    if (allowed && !allowed.includes(name)) continue;
    out[name] = body;
  }
  return out;
}

export function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
