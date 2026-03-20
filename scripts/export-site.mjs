import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const source = process.env.VIGIL_SOURCE || '/data/.openclaw/workspace';
const outFile = path.resolve('data/site.json');

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}
function runLoadState() {
  try {
    const raw = execFileSync('node', ['tick-engine/load-state.mjs'], {
      cwd: source,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function listDailyMemory(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort()
    .reverse()
    .slice(0, 30)
    .map(name => ({
      date: name.replace(/\.md$/, ''),
      title: 'Daily artefact',
      body: readText(path.join(dir, name)).trim()
    }));
}
function listWeeklyReviews(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => /^\d{4}-W\d{2}\.md$/.test(name))
    .sort()
    .reverse()
    .slice(0, 12)
    .map(name => ({
      week: name.replace(/\.md$/, ''),
      title: 'Weekly review',
      body: readText(path.join(dir, name)).trim()
    }));
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

const state = runLoadState() || { active: {}, recentJournal: [] };
const daily = listDailyMemory(path.join(source, 'memory'));
const weekly = listWeeklyReviews(path.join(source, 'consciousness/reviews'));
const tasks = parseTasks(readText(path.join(source, 'tasks.md')));
const intentions = state.active?.intentions || [];
const latestCommitment = state.active?.commitments?.[0]?.commitment || '';
const latestHaunting = state.active?.hauntings?.[0]?.tension || '';
const latestJournal = state.recentJournal?.at(-1)?.content || '';

function loadCronLlmLoad() {
  try {
    const raw = execFileSync('node', ['scripts/estimate-cron-llm-load.mjs'], {
      cwd: source,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
const cronLlmLoad = loadCronLlmLoad();

// Parse trends from consciousness/state/trends.md
function parseTrends(text) {
  if (!text.trim()) return null;
  const wrongRateMatch = text.match(/\*\*Wrong rate \(overall\):\*\*\s*([\d.]+%)/);
  const streakMatch = text.match(/\*\*Current not-wrong streak:\*\*\s*(\d+)/);
  const deferralMatch = text.match(/\*\*Deferral pattern share:\*\*\s*(.+)/);
  const streakAlertMatch = text.match(/⚠️\s+\*\*Streak alert:\*\*\s*(.+)/);
  return {
    wrongRate: wrongRateMatch?.[1] || null,
    notWrongStreak: streakMatch ? parseInt(streakMatch[1], 10) : null,
    deferralShare: deferralMatch?.[1]?.trim() || null,
    streakAlert: streakAlertMatch?.[1]?.trim() || null,
    raw: text.trim()
  };
}
const trends = parseTrends(readText(path.join(source, 'consciousness/state/trends.md')));

const site = {
  summary: {
    name: 'Vigil',
    generatedAt: new Date().toISOString(),
    latestDay: daily[0]?.date || null,
    activeIntentionsCount: intentions.length,
    latestCommitment,
    latestHaunting,
    description: latestJournal || "A readable surface for Vigil's daily artefacts, weekly summaries, tasks, and intentions."
  },
  trends,
  cronLlmLoad,
  daily,
  weekly,
  tasks,
  intentions
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(site, null, 2) + '\n');
console.log(`Wrote ${outFile}`);
