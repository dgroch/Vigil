import fs from 'node:fs';
import path from 'node:path';

const source = process.env.VIGIL_SOURCE || '/data/.openclaw/workspace';
const outFile = path.resolve('data/site.json');

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function listDailyMemory(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort()
    .reverse()
    .slice(0, 30)
    .map(name => {
      const body = readText(path.join(dir, name)).trim();
      return { date: name.replace(/\.md$/, ''), title: 'Daily artefact', body };
    });
}

function parseTasks(text) {
  if (!text.trim()) return { open: [], closed: [] };
  const lines = text.split(/\r?\n/);
  const open = [];
  const closed = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^- \[ \]/.test(trimmed)) open.push({ status: 'open', text: trimmed.replace(/^- \[ \]\s*/, '') });
    if (/^- \[x\]/i.test(trimmed)) closed.push({ status: 'closed', text: trimmed.replace(/^- \[[xX]\]\s*/, '') });
  }
  return { open, closed };
}

const state = readJson(path.join(source, 'consciousness/state/summary.json')) || readJson(path.join(source, 'tick-state.json')) || null;
const loadState = readJson(path.join(source, '.tmp-load-state.json')) || null;
const memoryDir = path.join(source, 'memory');
const tasksText = readText(path.join(source, 'tasks.md'));
const daily = listDailyMemory(memoryDir);
const latestMemory = daily[0]?.body || '';
const latestCommitment = state?.active?.commitments?.[0]?.commitment || loadState?.active?.commitments?.[0]?.commitment || '';
const latestHaunting = state?.active?.hauntings?.[0]?.tension || loadState?.active?.hauntings?.[0]?.tension || '';
const intentions = state?.active?.intentions || loadState?.active?.intentions || [];
const tasks = parseTasks(tasksText);

const site = {
  summary: {
    name: 'Vigil',
    generatedAt: new Date().toISOString(),
    latestDay: daily[0]?.date || null,
    activeIntentionsCount: intentions.length,
    latestCommitment,
    latestHaunting,
    description: latestMemory ? latestMemory.split('\n').slice(0, 6).join('\n') : 'A developing record of Vigil’s work and state.'
  },
  daily,
  weekly: [],
  tasks,
  intentions
};

fs.writeFileSync(outFile, JSON.stringify(site, null, 2) + '\n');
console.log(`Wrote ${outFile}`);
